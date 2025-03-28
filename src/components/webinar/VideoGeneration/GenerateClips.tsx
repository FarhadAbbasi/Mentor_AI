import React from 'react'
import { toast } from 'react-toastify';
const SHOTSTACK_KEY = 'JDmOPJlVTMiob2Ffa4HeiGHxeUhkxE3P8se4OVAd';


const generateVideo = async (templateId: string, variables: any) => {

    try {
        const response = await fetch("http://localhost:5000/api/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                templateId: templateId,
                variables: variables
            }),
        });

        const result = await response.json();
        console.log("Video response is :", result.data);
        toast.dark('Video generation request has been submitted');

        if (result.data?.video_id) {
            console.log("Video ID is :", result.data.video_id);
            return result.data.video_id;
        }
    } catch (error) {
        console.error("Error in generating video is = ", error);
    }

}


const getNewVariables = (variables: any) => {
    const newVariables = Object.entries(variables).map(([key, value]) => ([
        key,
        key !== 'avatar' ? // correct key is: Avatar
            {
                name: key,
                type: 'text',
                properties: { content: value },
            } : 
            {
                name: key,
                type: "character",
                properties: { type: 'avatar', character_id: value },
            },
    ])
    );
    // console.log('New_Variables Ready for videoGen :', newVariables);
    return newVariables;
}



export const GenerateWelcomeClip = async (request: any) => {
    const templateId = 'f0d7de5da6f24a42af9ad0edb2522366';
    const filteredRequest = {
        // index: request.order_index,
        Name: request.name,
        Avatar: request.avatar_id,
        // type: request.type,
        Title: request.title,
        Subtitle: request.content,
        Script: request.script,
        // Price: request.price,
    }
    const variables = getNewVariables(filteredRequest);
    // console.log('Welcome variables: ', variables);

    const video_id = await generateVideo(templateId, variables);
    if (video_id) return { video_id, index: request.index }
}



export const GenerateAgendaClip = async (request: any) => {
    const templateId = 'd0fb9410d7f442108753fffa5878d380';
    const topics = request.content.split("\n");
    const filteredRequest = {
        Avatar: request.avatar_id,
        Topic1: topics[0],
        Topic2: topics[1],
        Topic3: topics[2],
        Topic4: topics[3],
        Topic5: topics[4],
        Script: request.script,
    }
    const variables = getNewVariables(filteredRequest);
    // console.log('Agenda variables: ', variables);

    const video_id = await generateVideo(templateId, variables);
    if (video_id) return { video_id, index: request.index }
}




export const GenerateContentClip = async (request: any) => {
    const templateId = 'd224a13a27414e8c9d324643b181064a';

    const filteredRequest = {
        Avatar: request.avatar_id,
        Title: request.title,
        Paragraph: request.content,
        Script: request.script,
    }
    const variables = getNewVariables(filteredRequest);
    // console.log('Content variables: ', variables);

    const video_id = await generateVideo(templateId, variables);
    if (video_id) return { video_id, index: request.index }
}


export const GenerateOfferClip = async (request: any) => {
    const templateId = 'bec250f62fae439fab9a183539bfddfc';
    const filteredRequest = {
        Title: request.title,
        Paragraph: request.content,
        Script: request.script,
        Price: request.price,
    }
    const variables = getNewVariables(filteredRequest);
    // console.log('Offer variables: ', variables);

    const video_id = await generateVideo(templateId, variables);
    if (video_id) return { video_id, index: request.index }
}



export const GenerateClosingClip = async (request: any) => {
    const templateId = 'f0d7de5da6f24a42af9ad0edb2522366';
    const filteredRequest = {
        Name: request.name,
        Avatar: request.avatar_id,
        Title: request.title,
        Subtitle: request.content,
        Script: request.script,
    }
    const variables = getNewVariables(filteredRequest);
    // console.log('Closing variables: ', variables);

    const video_id = await generateVideo(templateId, variables);
    if (video_id) return { video_id, index: request.index }
}

//////////////////////////////////   GENERATE FINAL VIDEO   ///////////////////////////////////////



export async function mergeVideos(videoClips: any, transition: string) {

    // const videoClips = [
    //     { url: 'clip1.mp4', duration: 4 },
    //     { url: 'clip2.mp4', duration: 6 },
    //   ];

    console.log('videoClips:', videoClips);
    let currentStart = 0; // Track the start time dynamically
    const timelineTracks = videoClips.map((clip, index) => {
        const clipData = {
            asset: { type: 'video', src: clip.video_url },
            start: currentStart,
            length: clip.duration,
            transition: index > 0 ? { in: transition, out: transition } : undefined // Add transitions
        };

        currentStart += clip.duration; // Move start time for the next clip
        return clipData;
    });
    console.log('timeline tracks:', timelineTracks);

    const timeline = {
        "timeline": {
            "tracks": [
                { "clips": timelineTracks, }
            ]
        },
        "output": {
            "format": "mp4",
            "resolution": "hd"
        }
    };

    const response = await fetch("https://api.shotstack.io/stage/render", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": SHOTSTACK_KEY,
        },
        body: JSON.stringify(timeline)
    });

    const data = await response.json();
    console.log('ShotStack Response:', data);
    if (data.response.id) {
        return data.response.id; // This is the render ID
    }

}



const checkRenderStatus = async (renderId: string) => {
    if(!renderId) return ;

    const response = await fetch(`https://api.shotstack.io/stage/render/${renderId}`, {
        headers: {
            'x-api-key': SHOTSTACK_KEY,
        },
    });

    const data = await response.json();
    console.log('Render Data:', data);
    console.log('Render Status:', data.response.id);

    if (data.response.status === 'done') {
        console.log('Final Video URL:', data.response.url);
        return data.response; // This is your final video link
    } else {
        console.log('Still processing...');
        toast.warn('Video is Processing...')
        return null;
    }
};



export const checkFinalVideoStatus = async (renderId: string, setFinalVideo: any, interval = 30000) => {
    // let videoData = null;

    const videoData = await checkRenderStatus(renderId);
    if (videoData?.status === 'done') {
        console.log(' Video is ready:', videoData);
        setFinalVideo(videoData);
        toast.success(' Final video is ready now!');
        return videoData;
    } else {
        setTimeout(() => checkFinalVideoStatus(renderId, setFinalVideo), 30000); // Wait 30 seconds and check again
    }
};
