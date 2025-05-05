import { useState, useEffect } from 'react';
import { useWebinarStore } from '../../../stores/webinarStore';
import * as queries from '../../../lib/database/queries';
import * as slidesDB from '../../../lib/database/slides';
import { toast, ToastContainer } from 'react-toastify';
import { checkFinalVideoStatus, GenerateAgendaClip, GenerateClosingClip, GenerateContentClip, GenerateOfferClip, GenerateWelcomeClip, mergeVideos, pollUntilReady, requestGenerateSubtitles, requestVideoJoin, requestVideoSideBySide } from './GenerateClips';
import { saveFinalVideo, saveFinalVideoId, saveFinalVideoSubtitles, saveLandingPage, saveLandingPageStatus, saveVideoClips } from '../../../lib/database/videoClips';
import { ArrowDown, ArrowDownAZIcon, CheckCircle2, Download, TicketCheckIcon } from 'lucide-react';
import ShotStackTransitions from './ShotStackTransitions';
import { generateLandingPageContent, prepareContentWithImages, saveLandingPageContent } from './GenLandingPageContent';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';

export function ReviewandRelease() {
  const { user } = useAuthStore();
  const { currentWebinarId } = useWebinarStore();
  const [webinarData, setWebinarData] = useState<any>(null);
  const [avatar, setAvatar] = useState<any>(null);
  const [theme, setTheme] = useState<any>(null);
  const [name, setName] = useState('');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [slides, setSlides] = useState<Slide[]>([]);

  const [templates, setTemplates] = useState([]);
  const [templateID, setTemplateID] = useState<string | null>(null);
  const [templateDetails, setTemplateDetails] = useState<string | null>(null);
  const [videoClips, setVideoClips] = useState<any>([]);  // 
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [selectedTransition, setSelectedTransition] = useState('reveal');
  const [isGeneratingClips, setGeneratingClips] = useState<boolean>(false);
  const [finalVideo, setFinalVideo] = useState<any>([]);
  const [finalVideoUrl, setFinalVideoUrl] = useState(null); // For FFmpeg video URL

  const [isGeneratingLandingPageContent, setGeneratingLandingPageContent] = useState(false);
  const [landinPageContent, setLandinPageContent] = useState<any>(null);
  const [userSiteName, setUserSiteName] = useState<string | null>();
  const [websiteTemplateName, setWebsiteTemplateName] = useState<string | null>(null);
  const [isCreatingLandingPage, setCreatingLandingPage] = useState(false);
  const [isDeployingLandingPage, setDeployingLandingPage] = useState(false);
  const [landingPageData, setLandinPageData] = useState<any | null>(null);


  useEffect(() => {
    const fetchData = async () => {

      if (!currentWebinarId) return;

      try {
        const data = await queries.getWebinarWithProgress(currentWebinarId);
        data.slides.sort((a: any, b: any) => a.order_index - b.order_index);
        console.log('Webinar Data in Review and Release', data);
        setWebinarData(data);
        // setSlides(data.slides);

        if (data.avatar_id) {
          const avatarData = await queries.getAvatar(data.avatar_id);
          setAvatar(avatarData);
          // console.log('Avatar Data: ', avatarData);
        }

        if (data.theme_id) {
          const themeData = await queries.getTheme(data.theme_id);
          setTheme(themeData);
          // console.log('Theme Data: ', themeData);
          setTemplateID(themeData.agenda_template_id);
        }

        // Fetching video Clips, if any
        // if (data.video_id) {  // Fetching Final Video, if any
        const videoData = await queries.getVideoClips(currentWebinarId);
        if (videoData) setVideoClips(videoData);
        console.log('Video Clips Data: ', videoData);
        // }

        if (data.video_id) {  // Fetching Final Video, if any
          const videoData = await queries.getFinalVideo(currentWebinarId);
          setFinalVideo(videoData[0]);
          console.log('Final Video Data: ', videoData);
        }

        if (data.landing_page_deployed) {  // Fetching Landing Page URL, if any
          const landing_page_data = await queries.getLandingPageData(currentWebinarId);
          if (landing_page_data.url) {
            setLandinPageData(landing_page_data);
            console.log('Landing page data:', landingPageData);
          }
        }

      } catch (err) {
        console.error('Error fetching webinar data:', err);
        setError('Failed to fetch webinar data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentWebinarId]);


  const saveSlides = async () => {
    if (!currentWebinarId) return;

    // setIsSaving(true);
    try {
      const data = await slidesDB.saveSlides(currentWebinarId,
        webinarData.slides.map((slide: any, index: number) => ({
          title: slide.title,
          content: slide.content,
          order_index: index,
          type: slide.type,
          notes: slide.notes,
          script: slide.script,
        }))
      );
      // console.log('saved slides are : ', data);
      toast.success('Slide has been saved');

    } catch (err) {
      setError('Failed to save changes in slides.');
      toast.error('Failed to save changes in slide');
    };
  }




  const fetchTemplates = async () => {

    try {
      const response = await fetch("http://localhost:5000/api/templates");
      const data = await response.json();
      setTemplates(data?.data?.templates);
      console.log("Templates :", data?.data?.templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };


  // useEffect(() => {
  const retrieveTemplateDetails = async () => {
    if (!templateID) return
    console.log('Template ID to retrieve =', templateID)

    const URL = `http://localhost:5000/api/retrieveTemplateDetails/${templateID}`;
    try {
      const response = await fetch(URL)
      const data = await response.json();
      setTemplateDetails(data.data.variables);
      console.log("Template Details :", data?.data);


    } catch (error) {
      console.error("Error fetching Template Details:", error);
    }
  };
  // retrieveTemplateDetails();
  // }, [templateID])


  const handleGenerateVideos = async () => {
    if (!currentWebinarId || !webinarData?.slides?.length || !avatar?.heygen_avatar_id) {
      alert('Required data is missing: slides or avatar selection.');
      return;
    }
    setGeneratingClips(true);
    setVideoClips([]);
    try {

      // Prepare video generation payload
      const videoRequests = webinarData.slides.map((slide: any) => ({
        index: slide.order_index,
        name: name || 'Mentor',
        avatar_id: avatar.heygen_avatar_id,
        type: slide.type,
        title: slide.title,
        content: slide.content,
        script: slide.script,
        price: webinarData.knowledge_bases[0].campaign_outline.productPrice || '$5',
      }));
      console.log('Video Requests: ', videoRequests);


      // Start video generation for all slides, it will return video_ids to check status of the respective videos
      const videoOutputIDs = await Promise.all(videoRequests.map(async (request: any) => {
        let response;

        switch (request.type) {
          case 'intro':
            response = await GenerateWelcomeClip(request);
            console.log('Intro response in Review&Release =', response);
            return response;

          case 'agenda':
            response = GenerateAgendaClip(request);
            console.log('Agenda response in Review&Release =', response);
            return response;

          case 'content':
            response = GenerateContentClip(request);
            console.log('Content response in Review&Release =', response);
            return response;

          case 'offer':
            response = GenerateOfferClip(request);
            return response;

          case 'close':
            response = GenerateClosingClip(request);
            return response;
          default:
        }
      })
      );

      videoOutputIDs.sort((a, b) => a.index - b.index); // Sort videoIDs wrt slides index

      await Promise.all(videoOutputIDs.map(async (video_output: any) => {
        console.log('Video Output:', video_output);

        if (video_output) await checkVideoStatus(video_output); // Assuming checkVideoStatus is an async function

        // if (videoOutputs.length === (video_output.index + 1)) {
        //   console.log('All Videos Generated. Click SAVE!');
        //   console.log('Video Status before sorting:', videoClips);
        // toast.success('All Videos Generated. Click SAVE!');
        // }
      }));

      videoClips.sort((a: any, b: any) => a.index - b.index);  // Sorting videoClips, which have been updated within checkVideoStatus function
      if (videoClips?.length === webinarData?.slides.length) toast.success('All videos generated successfully! Click SAVE')

    } catch (err) {
      console.log('Error in Generate Videos is:', err);
      setGeneratingClips(false);
    } finally {
      setGeneratingClips(false);
    }

  };


  // console.log('Video Status:', videoClips);

  const checkVideoStatus = async (videoData: any) => { // videData = {video_id, index}
    if (!videoData) return

    const URL = `http://localhost:5000/api/checkVideoStatus/${videoData.video_id}`;
    try {
      const response = await fetch(URL);
      const data = await response.json();

      if (data?.status === "completed") {
        console.log("Video URL:", data.video_url);
        toast.success('Video Status: COMPLETED!');
        const updated_data = { ...data, index: videoData.index }; // Assign correct index to the video
        console.log('Video Data with index:', updated_data);
        setVideoClips((prev: any) => [...prev, updated_data]); // Add new video in videoClips 
      }
      else if (data?.status === "failed") {
        console.error("Video generation failed:", data.error);
        toast.error('Video Status: FAILED. Please Try Again!');
        return null;
      } else {
        toast.warn(`Video status:  ${data.status ? data.status : "PENDING!"}`);
        setTimeout(() => checkVideoStatus(videoData), 30000); // Wait 30 seconds and check again
      }
    } catch (error) {
      console.error("Error checking video status:", error);
    }

    // const result = await response.json();
    //     console.log("Video Data Message:", result.data.message);
    //     console.log("Video Message:", result.message);
    //     console.log("Video URL:", result.videoUrl);
    //     console.log("Video Thumbnail :", result.thumbnailUrl);

    //     // setVideoClips(result.data.status);
    //   } catch (error) {
    //     console.error("Error checking video status:", error);
    //   }

  };


  const handleSaveVideoClips = async () => {
    if (!currentWebinarId || !videoClips.length) return;
    console.log('webinarID in saveVideos', currentWebinarId);
    console.log('video Status in saveVideos', videoClips);
    videoClips.sort((a: any, b: any) => a.index - b.index);  // Sort wrt index before saving 

    try {
      await saveVideoClips(currentWebinarId,
        videoClips.map((clip: any) => ({
          heygen_video_id: clip.id,
          order_index: clip.index,
          video_url: clip.video_url,
          thumbnail_url: clip.thumbnail_url,
          duration: clip.duration,
        })
        ));

      toast.success('Videos Saved successfully!');
    } catch (err: any) {
      console.error('Error saving videos:', err.message || err);
      toast.error('Failed to save video clips. Please try again.');
    }
  };


  const handleGenerateFinalVideo = async () => {
    if (!videoClips.length) { toast.error('Please generate video clips first.'); return; }
    setLoadingVideos(true);

    try {
      const final_video_id = await mergeVideos(videoClips, selectedTransition);
      console.log('Final Video ID in R&R :', final_video_id);
      if (!final_video_id) { toast.error('Failed to generate final video. Please try again.'); return; }
      await checkFinalVideoStatus(final_video_id, setFinalVideo);
    } catch {
      console.error('Error generating final video:', error);
      toast.error('Failed to generate final video. Please try again.');
      setLoadingVideos(false);
    } finally {
      setLoadingVideos(false);
    }
  }

  // console.log('Final Video:', finalVideo);

  const handleSaveFinalVideo = async () => {
    if (!currentWebinarId || !finalVideo) return;
    console.log('Final Video in saveFinalVideo', finalVideo);

    saveFinalVideoId(currentWebinarId, finalVideo.id);
    const response = await saveFinalVideo(currentWebinarId, finalVideo);
    console.log('Save Final Video Response:', response);
  };


  const handleFinalSubmit = async () => {
    if (!currentWebinarId) return;

    try {
      await queries.updateWebinarStatus(currentWebinarId, 'submitted');
      // saveSlides();   // Save Changes made in Slides and Script
      toast.success('Webinar has been submitted successfully!');
    } catch (err: any) {
      console.error('Error submitting webinar:', err.message || err);
      alert('Failed to submit webinar. Please try again.');
    }
  };



  const handleVideoJoining = async () => {
    if (!currentWebinarId || !videoClips.length) return;
    setLoadingVideos(true);
    toast.success('Starting Final Video Generation ... !');

    const clipUrls = videoClips.map((clip: any) => clip.video_url);

    const payload = {
      webinarId: currentWebinarId,
      clipUrls: clipUrls,
      hasIntro: true,
      hasOutro: true
    }


    try {
      // const jobId = await requestVideoJoin(payload);
      const jobData = await requestVideoJoin(payload);
      // console.log('Job submitted. ID:', jobId);
      console.log('Job submitted. Data:', jobData);
      console.log('Job submitted. Data_URL:', jobData?.publicUrl);

      if (jobData?.publicUrl) {
        setFinalVideoUrl(jobData.publicUrl);
        handleSaveJoinedVideo(jobData.publicUrl);
        console.log('Final Video URL:', jobData.publicUrl);
        toast.success('Final Video Created successfully!');
      }


      // Optionally trigger progress UI here
    } catch (err) {
      toast.error('Failed to create Final video. Please try again.')
      console.log('Error while creating the video.', err);
    }

    setLoadingVideos(false);

  };



  // console.log('Final Video FFmpeg:', finalVideoUrl);
  const handleSaveJoinedVideo = async (finalVideoUrl: any) => {
    if (!currentWebinarId) return;
    console.log('Final Video in saveFinalVideo', finalVideoUrl);

    const payload = { url: finalVideoUrl, }
    const response = await saveFinalVideo(currentWebinarId, payload);
    console.log('Saved video response: ', response);
    if (response[0]?.video_id) {
      saveFinalVideoId(currentWebinarId, response[0]?.video_id);
      toast.success('Final Video saved successfully!');
    }

  };


  const [subtitlesUrl, setSubtitlesUrl] = useState(null);
  // console.log('Subtitles URL: ', subtitlesUrl);

  const handleGenerateSubtitles = async () => {
    if (!currentWebinarId || !finalVideo) return;
    // setLoadingVideos(true);
    toast.success('Starting Subtitles Generation ... !');
    const payload = {
      webinarId: currentWebinarId,
      videoUrl: finalVideo?.url,
    }

    try {
      // const jobId = await requestVideoJoin(payload);
      const jobData = await requestGenerateSubtitles(payload);
      // console.log('Job submitted. ID:', jobId);
      console.log('Subtitles generated. Response:', jobData);
    
      if (jobData?.message) toast.success(jobData?.message);
      if (jobData?.publicUrl) {
        console.log('Subtitles URL:', jobData.publicUrl);
        setSubtitlesUrl(jobData.publicUrl);
        await saveFinalVideoSubtitles(currentWebinarId, jobData.publicUrl);
      }

    } catch (err) {
      toast.error('Failed to create Subtitles. Please try again.')
      console.log('Error while creating Subtitles.', err);
    }

    setLoadingVideos(false);

  };





  const [webhooks, setWebhooks] = useState<any>([]);
  const fetchWebhooks = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/availableWebhookEvents");
      const data = await response.json();
      console.log("Webhooks :", data?.data);
      const webhooks = data?.data;
      setWebhooks(webhooks);

    } catch (error) {
      console.error("Error fetching webhooks:", error);
    }
  };






  const handleGenerateLandingPageContent = async () => {
    if (!currentWebinarId) return;
    console.log('Generating Landing Page Content...');
    toast.success('Generating Landing Page Content...');
    setGeneratingLandingPageContent(true);


    try {
      // Generate content for landing Page
      const contentLP = await generateLandingPageContent(webinarData.knowledge_bases[0], webinarData.slides);

      if (contentLP) {
        // Now get images for landing Page
        console.log("Landing Page Content in R&R without images:", contentLP);
        const updatedContent = await prepareContentWithImages(contentLP);  // Uncomment for content with images
        console.log('Updated Content with images:', updatedContent);

        setLandinPageContent(updatedContent);
        // saveLandingPageContent(currentWebinarId, updatedContent);
        toast.success('Landing Page content generated successfully !');
        setGeneratingLandingPageContent(false);
      }
    } catch (error) {
      console.error("Error generating landing page Content:", error);
      toast.error('Failed to generating landing page Content.');
      setGeneratingLandingPageContent(false);
    }
    finally {
      setGeneratingLandingPageContent(false);
    }
  }


  // console.log('landing page content :', landinPageContent);
  // const handlePrepareContentWithImages = async () => {
  //   if (!currentWebinarId || !saveLandingPageContent) return;
  //   const contentWithImages = await prepareContentWithImages(landinPageContent);
  //   console.log('Landing Page Content with Images:', contentWithImages);
  //   setLandinPageContent(contentWithImages);
  // }


  const handleSaveLandingPageContent = async () => {
    if (!currentWebinarId || !landinPageContent) return;
    console.log('saving ladning page');
    const data = await saveLandingPageContent(currentWebinarId, landinPageContent);
    toast.success('Landing Page content saved successfully!')
    console.log('Saved Landing Page Content is: ', data);
  }





  const websiteTemplates = [
    { name: 'template_1', id: 'template_1' },
    { name: 'template_2', id: 'template_2' },
    { name: 'template_3', id: 'template_3' },
    { name: 'template_4', id: 'template_4' },
    { name: 'template_5', id: 'template_5' },
    { name: 'template_6', id: 'template_6' },
    { name: 'template_7', id: 'template_7' },
    { name: 'website', id: 'template1' },
    { name: 'binance', id: 'template2' },
  ];
  // console.log('Website Template Name :', websiteTemplateName);
  const createLandingPage = async () => {
    if (!user) return;
    if (!currentWebinarId) return;
    if (!userSiteName) { toast.error('Please enter your Landing Page Name!'); return }
    if (!websiteTemplateName || websiteTemplateName === 'Select Web Template') { toast.error('Please select a Template'); return; }
    setCreatingLandingPage(true);

    const inputWebUserData = {
      webinar_id: currentWebinarId,
      user_id: user.id,
      email: user.email,
    };

    console.log('Webinar Input Data:', inputWebUserData);
    console.log('template Name:', websiteTemplateName);
    console.log('Site Name:', userSiteName);

    try {
      const response = await fetch("http://localhost:5000/api/createLandingPage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          webinarData: inputWebUserData,
          templateName: websiteTemplateName,
          landingPageName: userSiteName,
        }),
      });

      const deployResponse = await response.json();
      console.log("Landing Page message:", deployResponse?.message);
      console.log("Landing Page Data:", deployResponse.data);
      if (deployResponse?.data.url) {
        setLandinPageData(deployResponse.data);
        saveLandingPageStatus(currentWebinarId);
        toast.success('Landing Page created successfully. Click SAVE LANDING PAGE!');
        setCreatingLandingPage(false);
      }
    } catch (error) {
      console.error("Error creating landing page:", error);
      toast.error('Failed to create landing page. Please try again.');
      setCreatingLandingPage(false);
    }
  }

  const deployNewTemplate = async () => {
    if (!user) return;
    if (!currentWebinarId || !websiteTemplateName || websiteTemplateName === 'Select Web Template') {
      toast.error('Please select a Web Template')
      return;
    }
    setDeployingLandingPage(true);

    const inputWebUserData = {
      webinar_id: currentWebinarId,
      user_id: user.id,
      email: user.email,
    };
    console.log('Webinar Input Data:', inputWebUserData);
    console.log('templateName:', websiteTemplateName);

    try {
      const response = await fetch("http://localhost:5000/api/deployLandingPage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          webinarData: inputWebUserData,
          site_id: landingPageData.site_id,
          templateName: websiteTemplateName,
        }),
      });

      const deployResponse = await response.json();
      console.log("Landing Page message:", deployResponse?.message);
      console.log("Landing Page Data:", deployResponse.data);
      if (deployResponse.data.url) {
        setLandinPageData(deployResponse.data);
        toast.success('New template deployed successfully!');
        setDeployingLandingPage(false);
      }
    } catch (error) {
      console.error("Error creating landing page:", error);
      toast.error('Failed deploying new template. Please try again.');
      setDeployingLandingPage(false);
    }
  }

  // console.log('landing page data:', landingPageData);
  const handleSaveLandingPage = async () => {
    console.log('Landin Page in Save function', landingPageData);
    if (!landingPageData) return;

    const response = await saveLandingPage(webinarData.id, landingPageData);
    // console.log('Save landing page response in R&R :', response);
  }






  const [podcastVideoUrl, setPodcastVideoUrl] = useState(null);
  // console.log('Podcast Video FFmpeg:', podcastVideoUrl);

  const handleVideoSideBySide = async () => {
    if (!currentWebinarId || !videoClips.length) return;

    console.log('Generating Side By Side video ... ');
    toast.success('Generating Side By Side video ... ');
    setLoadingVideos(true);


    const payload = {
      // webinarId: currentWebinarId,
      input1Url: videoClips[0].video_url,
      input2Url: videoClips[1].video_url,
    }


    try {
      // const jobId = await requestVideoJoin(payload);
      const jobData = await requestVideoSideBySide(payload);
      // console.log('Job submitted. ID:', jobId);
      console.log('Job submitted. Data:', jobData);
      console.log('Job submitted. Data_URL:', jobData?.publicUrl);

      if (jobData?.message) toast.success(jobData?.message);
      if (jobData?.publicUrl) {
        setPodcastVideoUrl(jobData.publicUrl);
        console.log('Podcast Video URL:', jobData.publicUrl);
        // handleSaveVideoSideBySide(jobData.publicUrl);
      }


      // Optionally trigger progress UI here
    } catch (err) {
      toast.error('Failed to create Final video. Please try again.')
      console.log('Error while creating the video.', err);
    }

    setLoadingVideos(false);


  }


  // const handleSaveVideoSideBySide = async (podcastVideoUrl: any) => {
  //   if (!currentWebinarId) return;
  //   console.log('Podcast Video in savePodcastVideo', podcastVideoUrl);

  //   const payload = { url: finalVideoUrl, }
  //   const response = await saveFinalVideo(currentWebinarId, payload);
  //   console.log('Saved video response: ', response);
  //   if (response[0]?.video_id) {
  //     saveFinalVideoId(currentWebinarId, response[0]?.video_id);
  //     toast.success('Final Video saved successfully!');
  //   }


  // }





  const goToNextSlide = () => {
    if (webinarData.slides && currentSlideIndex < webinarData.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const goToPreviousSlide = () => {
    if (webinarData.slides && currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const goToNextVideo = () => {
    if (videoClips && currentVideoIndex < videoClips.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  const goToPreviousVideo = () => {
    if (videoClips && currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };



  if (loading) {
    return <div className="text-center py-12 text-white">Loading webinar data...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-900/50 text-red-200 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      <ToastContainer />
      <div className="border-b border-gray-800 pb-4">
        <h2 className="text-2xl font-semibold">Review and Release</h2>
        <p>Review all your entered data before generating the webinar.</p>
      </div>

      {webinarData && (
        <div className="space-y-6">
          <section>
            <h3 className="text-xl font-semibold">Webinar Details</h3>
            <div className="bg-gray-800 p-4 space-y-1 rounded-lg">
              {/* <p><strong>Title : </strong> {webinarData.knowledge_bases[0].campaign_outline.productName || 'N/A'}</p> */}
              <p><strong>Title : </strong> {webinarData.name || 'N/A'}</p>
              {/* <p><strong>Description :</strong> {webinarData.name || 'N/A'}</p> */}
              <p><strong>Description :</strong> {webinarData.knowledge_bases[0].webinar_summary.benefits || 'N/A'}</p>
              <p><strong>Status :</strong> {webinarData.status || 'N/A'}</p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Slides and Scripts</h3>
            <div className="bg-gray-800 p-4 rounded-lg space-y-4">
              {webinarData.slides?.length > 0 ? (
                <>
                  <div className="flex justify-between items-center">
                    <button
                      onClick={goToPreviousSlide}
                      disabled={currentSlideIndex === 0}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span>Slide {currentSlideIndex + 1} of {webinarData.slides.length}</span>
                    <button
                      onClick={goToNextSlide}
                      disabled={currentSlideIndex === webinarData.slides.length - 1}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>

                  <div className="flex space-x-4 p-4 border border-gray-700 rounded-lg bg-gray-900">
                    <div className="w-1/2">
                      <h4 className="text-lg font-semibold">Slide Details</h4>
                      <p><strong>Title:</strong>
                        <input type='text' value={webinarData.slides[currentSlideIndex].title}
                          className="w-full bg-gray-800 px-4 py-2 rounded-lg"
                          onChange={(e) => setWebinarData({
                            ...webinarData,
                            slides: webinarData.slides.map((s: any, index: number) => (
                              index === currentSlideIndex ? { ...s, title: e.target.value } : s))
                          })}
                        />
                      </p>
                      <p><strong>Content:</strong>
                        <textarea value={webinarData.slides[currentSlideIndex].content}
                          className="w-full bg-gray-800 px-4 py-2 rounded-lg"
                          onChange={(e) => setWebinarData({
                            ...webinarData,
                            slides: webinarData.slides.map((s: any, index: number) => (
                              index === currentSlideIndex ? { ...s, content: e.target.value } : s))
                          })}
                        />
                      </p>
                      <p><strong>Notes:</strong> {webinarData.slides[currentSlideIndex].notes || 'N/A'} </p>
                    </div>

                    <div className="w-1/2 bg-gray-900 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold">Script</h4>
                      <p> <textarea value={webinarData.slides[currentSlideIndex].script || 'No script available.'}
                        className="w-full h-full bg-gray-800 px-4 py-2 rounded-lg " rows={5}
                        onChange={(e) => setWebinarData({
                          ...webinarData,
                          slides: webinarData.slides.map((s: any, index: number) => (
                            index === currentSlideIndex ? { ...s, script: e.target.value } : s))
                        })}
                      /> </p>
                      <button
                        onClick={() => saveSlides()}
                        className="m-2 px-4 py-2 bg-teal-600 text-white flex justify-self-end rounded-lg hover:bg-teal-700 disabled:opacity-50"
                      >
                        Save
                      </button>

                    </div>
                  </div>

                </>
              ) : (
                <p className="text-gray-400">No slides created yet.</p>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Avatar</h3>
            <div className="bg-gray-800 p-4 space-y-2 rounded-lg">
              {avatar ? (
                <>
                  <p><strong>Name:</strong> {avatar.name}</p>
                  <div>
                    <p><strong>Preview Video:</strong></p>
                    <video controls className="w-96 h-56 rounded-lg">
                      <source src={avatar.preview_video_url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </>
              ) : (
                <p className="text-gray-400">No avatar selected.</p>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Theme</h3>
            <div className="bg-gray-800 p-4 space-x-8 flex items-center  rounded-lg">
              {theme ? (
                <div className='flex space-x-6 items-end'>
                  <div>
                    <p><strong>Name:</strong> {theme.name}</p>
                    <p><strong>Preview:</strong></p>
                    <img
                      src={theme.preview_url}
                      alt={`Preview of ${theme.name}`}
                      className="w-96 h-auto rounded-lg"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">No theme selected.</p>
              )}
              <div className='flex flex-col items-start bg-gray-700 p-4 rounded-lg'>
                Enter Presenter's Name :
                <input type='text' value={name} onChange={(e) => setName(e.target.value)}
                  className="bg-gray-700 border m-4 px-4 py-2 rounded-lg" placeholder='Your Name' />
              </div>
            </div>
          </section>

          <section>
            <h1 className='text-xl font-semibold'> Templates </h1>
            <div className="bg-gray-800 p-4 rounded-lg">
              <button
                className="mx-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 "
                onClick={() => fetchTemplates()} >
                {loading ? 'Fetching Templates...' : 'Fetch Templates'}
              </button>
              <button
                className="mx-4 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 "
                onClick={() => setTemplates([])} >
                Hide Templates
              </button>
              {/* <button
                className="mx-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 hover:scale-[1.03]"
                onClick={() => retrieveTemplateDetails()} >
                Retrieve Template Details
              </button>
              <button
                className="mx-4 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 hover:scale-[1.03]"
                onClick={() => setTemplateDetails(null)} >
                Hide Template Details
              </button> */}

              {/* This div is to be commented Out */}
              {/* <div>
                <p><strong> Parameters </strong></p>
                {Object.entries(theme).map(([key]) => (
                  <div>
                    <p> {key}  </p>
                  </div>
                ))}
              </div> */}
              {/* This div is to be commented Out */}

              <div className='bg-slate-900 mt-4'>
                {templateDetails && Object.entries(templateDetails).map(([key, value]) => (
                  <div key={key} className='m-4 p-2 w-96 flex space-x-6 border-b'>
                    <h1 className='min-w-20'> {key} : </h1>
                    {/* <h1> {value.name} </h1> */}
                    <h1> Type = </h1>
                    <h1> {value.type}, </h1>
                  </div>
                ))}
              </div>


              <div className='flex overflow-auto scrollbar-hidden '>
                {templates?.map((template) => (
                  <div className='m-4 p-2 flex flex-col bg-slate-900 text-slate-400 rounded-t-lg'>
                    <h1 className='font-semibold text-white'> {template.name} </h1>
                    <h1> {template.template_id} </h1>
                    {/* <h1 className='w-[96]'> {template.thumbnail_image_url} </h1> */}
                    <div >
                      <img
                        src={template.thumbnail_image_url}
                        alt={template.name}
                        className="h-40 object-cover mt-4 rounded"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Actions</h3>
            <div className="p-4 space-x-4 bg-slate-700 flex rounded-lg">
              <button
                onClick={handleGenerateVideos}
                className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 hover:scale-[1.05]"
                disabled={isGeneratingClips}
              >
                {isGeneratingClips ? 'Generating Clips...' : 'Generate Video Clips'}
              </button>

              {/* <input className='p-2 bg-slate-600 text-white w-80 rounded'
                placeholder='Paste video ID here to check status' value={videoID} onChange={(e) => setVideoID(e.target.value)}
              />
              <button
                className="mx-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 hover:scale-[1.03]"
                onClick={() => checkVideoStatus(videoID)} >
                Check Video Status
              </button> */}

            </div>
          </section>

          <section>
            {videoClips?.length &&
              <>
                <h3 className="text-xl font-semibold">Videos</h3>
                <div className="bg-gray-800 p-4 space-y-2 rounded-lg" >
                  {videoClips.length === webinarData.slides.length &&
                    <div className='m-4 p-2 bg-emerald-600 flex rounded justify-self-end shadow-xl right-0 top-0'>
                      <CheckCircle2 /> <span className='px-1' /> All video clips have been generated !</div>}

                  <div className='m-4 p-4 bg-slate-900 flex flex-col justify-center '>
                    <div className="m-2 flex justify-center space-x-6 items-center">
                      <button
                        onClick={goToPreviousVideo}
                        disabled={currentVideoIndex === 0}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                      >  Previous Video
                      </button>
                      <span>Video {currentVideoIndex + 1} of {videoClips.length}</span>
                      <button
                        onClick={goToNextVideo}
                        disabled={currentVideoIndex === videoClips.length - 1}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                      >  Next Video
                      </button>
                    </div>

                    <video src={videoClips[currentVideoIndex]?.video_url} controls className='m-4 w-[40%] rounded '  >
                      Your browser does not support video format
                    </video>
                    <div className='flex '>
                      <button className='m-4 p-2 w-48 bg-teal-600 rounded hover:bg-teal-700'>
                        <a href={videoClips[currentVideoIndex]?.video_url} target='blank'> Download Video Clip </a>
                      </button>

                      <button
                        className="m-4 py-2 w-44 bg-green-600 text-white rounded hover:bg-green-700"
                        onClick={handleSaveVideoClips}>
                        Save Video Clips
                      </button>
                    </div>
                  </div>


                  {finalVideo && <>
                    <h3 className="m-4 text-xl font-semibold">Final Video </h3>
                    <div className='m-4 p-4 bg-slate-900 flex flex-col items-center'>

                      {/* <video src={finalVideo?.url} controls className='m-4 w-[70%] rounded'  >
                        Your browser does not support video format
                      </video> */}

                      <video className="rounded w-[70%] m-4" controls width="800" crossOrigin="anonymous" >
                        <source src={finalVideo?.url} type="video/mp4" />
                        {finalVideo.subtitles && <track src={finalVideo.subtitles} kind="subtitles" srcLang="en" label="English" default />}
                        Your browser does not support the video tag.
                      </video>


                      <div>
                        <button className='m-4 p-2 w-48 bg-teal-600 rounded hover:bg-teal-700'>
                          <a href={finalVideo?.url} target='blank'> Open Ful Screen Video </a>
                        </button>
                        {/* <button
                          className="m-4 p-2 w-44 bg-green-600 text-white rounded hover:bg-green-700"
                          onClick={handleSaveFinalVideo}>
                          Save Final Video
                        </button> */}
                      </div>
                    </div>

                  </>}


                  {/* <div className='m-4'>
                    <button className="m-4 p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                      onClick={() => fetchWebhooks()}
                    > Fetch Webhook List </button>
                    <button className="m-4 p-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700/50"
                      onClick={() => setWebhooks(null)}
                    > Hide Webhook List </button>

                    <div className='m-2 p-4 bg-slate-700 rounded-lg'>
                      <h1 className='text-teal-300'> Avalable Webhooks:  </h1>
                      {webhooks?.map((webhook: any) => (
                        <h1 className='font-sm text-slate-200'> {webhook} </h1>
                      ))}
                    </div>
                  </div> */}

                </div>
              </>}
          </section>

          <section>
            {videoClips.length && <>
              <h3 className="m-2 text-xl font-semibold">Final Video  Actions</h3>
              <div className='bg-gray-800 p-4 rounded-lg space-y-4 space-x-4'>

                <h3 className="m-4"> Select Transition
                  <ShotStackTransitions selectedTransition={selectedTransition} setSelectedTransition={setSelectedTransition} />
                </h3>
                <button
                  onClick={handleGenerateFinalVideo}
                  className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 hover:scale-[1.05]"
                  disabled={loadingVideos}
                >
                  {loadingVideos ? 'Generating Final Video...' : 'Generate Final Video ShotStack'}
                </button>

                <button
                  onClick={handleVideoJoining}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 hover:scale-[1.05]"
                  disabled={loadingVideos}
                >
                  {loadingVideos ? 'Generating Final Video...' : 'Generate Final Video FFmpeg'}
                </button>

                {finalVideo &&
                  <button className='m-4 p-1 bg-slate-700/20 text-teal-500 border-b hover:bg-slate-700'>
                    <a href={`${finalVideo?.url}`} target='blank'> Final Video URL </a>
                  </button>
                }

                <button
                  onClick={() => handleSaveJoinedVideo(finalVideoUrl)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:scale-[1.05]"
                >
                  Save Final  Video
                </button>



                <button
                  onClick={handleGenerateSubtitles}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 hover:scale-[1.05]"
                  disabled={loadingVideos}
                >
                  {loadingVideos ? 'Generating Subtitles ...' : 'Generate Video Subtitles'}
                </button>


                {subtitlesUrl &&
                  <button className='m-4 p-1 bg-slate-700/20 text-teal-500 border-b hover:bg-slate-700'>
                    <a href={`${subtitlesUrl}`} target='blank'> Subtitles URL </a>
                  </button>
                }

              </div>
            </>}
          </section>

          <section>
            <h3 className="m-2 text-xl font-semibold"> Podcast Video  Actions</h3>
            <div className='bg-gray-800 p-4 rounded-lg space-y-4 space-x-4'>
              <button
                onClick={handleVideoSideBySide}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 hover:scale-[1.05]"
                disabled={loadingVideos}
              >
                {loadingVideos ? 'Generating Podcast Video...' : 'Generate Podcast Video'}
              </button>


              {podcastVideoUrl &&
                <button className='m-4 p-1 bg-slate-700/20 text-teal-300 border-b hover:bg-slate-700'>
                  <a href={`${podcastVideoUrl}`} target='blank'> Podcast Video URL </a>
                </button>
              }


              {/* <button
                onClick={() => handleSaveVideoSideBySide(podcastVideoUrl)}
                className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-700 hover:scale-[1.05]"
              >
                Save Podcast Video
              </button> */}
            </div>
          </section>

          <section>
            <h3 className="m-2 text-xl font-semibold">Final Action </h3>
            <div className='bg-gray-800 p-4 rounded-lg space-y-4 space-x-4'>
              <button
                onClick={handleFinalSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:scale-[1.05]"
              >
                Submit Webinar
              </button>
            </div>
          </section>

          <section>
            <h3 className="m-2 text-xl font-semibold"> My Landing Page </h3>
            <div className='flex-col p-2 bg-gray-800 rounded-lg m-2 overflow-auto scrollbar-hidden '>
              <div className='flex-col'>

                {/* <button className="m-4 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  onClick={fetchLandingPage} > Get Landing Page Details
                </button> */}



                <div className='bg-slate-900/30'>
                  <button className='m-4 p-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 border border-blue-700 hover:'
                    onClick={handleGenerateLandingPageContent}
                  > {isGeneratingLandingPageContent ? 'Generating Content ...' : 'Generate Landing Page Content with AI'} </button>

                  {/* <button className='m-4 p-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 border border-lime-700 hover:border-slate-400'
                    onClick={handlePrepareContentWithImages}
                  > Get Images for Landing Page </button> */}


                  <button className='m-4 p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 '
                    onClick={handleSaveLandingPageContent}
                  > Save Landing Page Content</button>
                </div>



                {!landingPageData?.url &&
                  <div>
                    <input type='text' placeholder='Enter name of your new Landing Page..'
                      className='m-4 p-2 w-80 border border-slate-500 shadow-2xl rounded-lg bg-slate-700 text-white'
                      value={userSiteName}
                      onChange={(e) => setUserSiteName(e.target.value)}
                    />

                    <select className='m-4 p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700'
                      value={websiteTemplateName || 'Select Template'}
                      onChange={(e) => setWebsiteTemplateName(e.target.value)}
                    >
                      <option> Select Web Template </option>
                      {websiteTemplates?.map((template) => (
                        <option key={template.name}>
                          {template.name}
                        </option>
                      ))}
                    </select>

                    <button className="m-4 p-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50"
                      onClick={() => createLandingPage()}
                      disabled={isCreatingLandingPage}
                    > {isCreatingLandingPage ? 'Creating Landing Page ...' : 'Create Landing Page'} </button>

                  </div>
                }



                {landingPageData?.url &&
                  <div>

                    <select className='m-4 p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700'
                      value={websiteTemplateName || 'Select Template'}
                      onChange={(e) => setWebsiteTemplateName(e.target.value)}
                    >
                      <option> Select Web Template </option>
                      {websiteTemplates?.map((template) => (
                        <option key={template.name}>
                          {template.name}
                        </option>
                      ))}
                    </select>

                    <button className="m-4 p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                      onClick={() => deployNewTemplate()}
                      disabled={isDeployingLandingPage}
                    > {isDeployingLandingPage ? 'Deploying ...' : 'Deploy New Template'} </button>


                    <button className='m-4 p-2 bg-green-600 text-white rounded-lg hover:bg-green-700'
                      onClick={handleSaveLandingPage}
                    >  Save Landing Page </button>



                    <div className='flex items-center'>

                      <button className='m-4 p-1 bg-slate-700/20 text-teal-500 border-b hover:bg-slate-700'>
                        <a href={`${landingPageData.url}/mentor/${currentWebinarId}`} target='blank'> Website URL </a>
                      </button>
                      <button className='m-4 p-1 text-teal-500 border-b hover:bg-slate-700'>
                        <a href={landingPageData.admin_url} target='blank'> Admin Page URL </a>
                      </button>
                      <h1 className='m-6 p-2 rounded-lg bg-slate-900 text-slate-100 flex'><p className='px-2 text-teal-500'>
                        Website Name: </p> {landingPageData.name || 'my-site-name.com'} </h1>

                    </div>
                  </div>
                }


              </div>
            </div>


          </section>
        </div>
      )}
    </div>
  );
}




// const response = await fetch("http://localhost:5000/api/generate", {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/json",
//   },
//   body: JSON.stringify({
//     templateId: theme.opening_template_id,
//     variables: {
//       name: request.name,
//       title: request.title,
//       subtitle: request.subtitle,
//       script: request.script,
//       avatar_id: request.avatar_id,
//     },
//   }),
// });

// const result = await response.json();
// toast.dark('Video generation is under process...');
// // console.log("For Slide:", request.title);
// console.log("Video response is :", result.data);

// if (result.data.video_id) {
// console.log("Video ID is :", result.data.video_id);
// setVideoId(result.data.video_id);
// checkVideoStatus(result.data.video_id);
// checkVideoStatus();
// }
// } catch (error) {
// console.error("Error generating video:", error);
// }




// setLoadingVideos(true);
// try {
//   // Prepare video generation payload
//   const videoRequests = webinarData.slides.map((slide: any) => ({
//     templateId: avatar.heygen_avatar_id, // Use heygen_avatar_id from the avatar
//     script: slide.script,
//     title: slide.title,
//   }));


//   // Send request to /generate-videos endpoint
//   const response = await axios.post('http://127.0.0.1:3000/generate-videos', { slides: videoRequests });

//   if (response.data?.videos) {
//     alert('Videos are being generated. You will be notified when they are ready.');
//   } else {
//     alert('Failed to initiate video generation.');
//   }
// } catch (err) {
//   console.error('Error generating videos:', err.message || err);
//   alert('Error occurred during video generation.');
// } finally {
//   setLoadingVideos(false);
// }


// const API_KEY = import.meta.env.VITE_HEYGEN_KEY
// const URL = `https://api.heygen.com/v2/v2/template/${theme.opening_template_id}/generate`
