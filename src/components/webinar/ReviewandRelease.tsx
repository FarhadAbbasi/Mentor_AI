import React, { useState, useEffect } from 'react';
import { useWebinarStore } from '../../stores/webinarStore';
import * as queries from '../../lib/database/queries';
import axios from 'axios';
import { Slide } from '../../types/webinar';
import * as slidesDB from '../../lib/database/slides';
import { toast, ToastContainer } from 'react-toastify';


export function ReviewandRelease() {
  const { currentWebinarId } = useWebinarStore();
  const [webinarData, setWebinarData] = useState<any>(null);
  const [avatar, setAvatar] = useState<any>(null);
  const [theme, setTheme] = useState<any>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);

  useEffect(() => {
    const fetchData = async () => {

      if (!currentWebinarId) return;

      try {
        const data = await queries.getWebinarWithProgress(currentWebinarId);
        console.log('data in Review and Release', data);
        setWebinarData(data);
        setSlides(data.slides);

        if (data.avatar_id) {
          const avatarData = await queries.getAvatar(data.avatar_id);
          setAvatar(avatarData);
        }

        if (data.theme_id) {
          const themeData = await queries.getTheme(data.theme_id);
          setTheme(themeData);
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

  const handleGenerateVideos = async () => {
    if (!currentWebinarId || !webinarData?.slides?.length || !avatar?.heygen_avatar_id) {
      alert('Required data is missing: slides or avatar selection.');
      return;
    }

    setLoadingVideos(true);
    try {
      // Prepare video generation payload
      const videoRequests = webinarData.slides.map((slide: any) => ({
        templateId: avatar.heygen_avatar_id, // Use heygen_avatar_id from the avatar
        // script: slide.content,
        script: slide.script,
        title: slide.title,
      }));

      // Send request to /generate-videos endpoint
      const response = await axios.post('http://127.0.0.1:3000/generate-videos', { slides: videoRequests });

      if (response.data?.videos) {
        alert('Videos are being generated. You will be notified when they are ready.');
      } else {
        alert('Failed to initiate video generation.');
      }
    } catch (err) {
      console.error('Error generating videos:', err.message || err);
      alert('Error occurred during video generation.');
    } finally {
      setLoadingVideos(false);
    }
  };




  const handleFinalSubmit = async () => {
    if (!currentWebinarId) return;

    try {
      await queries.updateWebinarStatus(currentWebinarId, 'submitted');
      // saveSlides();   // Save Changes made in Slides and Script
      alert('Webinar has been submitted successfully!');
    } catch (err) {
      console.error('Error submitting webinar:', err.message || err);
      alert('Failed to submit webinar. Please try again.');
    }
  };

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

  // console.log('webinar slides : ', slides.id);
  // console.log('1st slide : ', webinarData.slides[0]);

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
            <div className="bg-gray-800 p-4 rounded-lg">
              {theme ? (
                <>
                  <p><strong>Name:</strong> {theme.name}</p>
                  <div>
                    <p><strong>Preview:</strong></p>
                    <img
                      src={theme.preview_url}
                      alt={`Preview of ${theme.name}`}
                      className="w-96 h-auto rounded-lg"
                    />
                  </div>
                </>
              ) : (
                <p className="text-gray-400">No theme selected.</p>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Actions</h3>
            <div className="flex space-x-4">
              <button
                onClick={handleGenerateVideos}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={loadingVideos}
              >
                {loadingVideos ? 'Generating Videos...' : 'Generate Videos'}
              </button>
              <button
                onClick={handleFinalSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Final Submit
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
