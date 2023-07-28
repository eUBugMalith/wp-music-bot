const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const { search } = require('yt-search');
const ytdl = require('ytdl-core');
const fs = require('fs');
const { exec } = require('child_process');

// Your WhatsApp Web client setup
const client = new Client({
    puppeteer: { headless: true, args: ['--no-sandbox'] },
    authStrategy: new LocalAuth(),
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async message => {
    if (message.fromMe) {
        // Ignore messages sent by the client itself
        return;
    }

    // Log the received message
    console.log(`Received message from ${message.from}: ${message.body}`);

    // Example: Process incoming message and send YouTube video search response
    if (message.body.startsWith('.play')) {
        const query = message.body.slice('.play '.length);
        try {
            const ytSearch = new YTSearch();
            const result = await ytSearch.find(query);

            // Send the search results back to the sender with the YouTube video link
            if (result) {
                const reply = `Search results for "${query}":\nTitle: ${result.title}\nURL: ${result.url}`;
                client.sendMessage(message.from, reply);

                // Download and send the video
                const videoIds = result.videoId;
                // await downloadAndSendVideo(MessageMedia, message.from, videoId);


                // Replace the video URL with the YouTube video you want to download
                const videoURL = `https://www.youtube.com/watch?v=${videoIds}`;

                // Set the download options
                const options = {
                    quality: 'lowestaudio',
                };

                // Download the video
                const download = async () => {
                    try {
                        const info = await ytdl.getInfo(videoURL);
                        const videoTitle = info.videoDetails.title;
                        const videoID = info.videoDetails.videoId;
                        const videoFileName = `${videoTitle}.mp4`;
                        const audioFileName = `${videoTitle}.mp3`;

                        const file = fs.createWriteStream(videoFileName);
                        ytdl(videoURL, options).pipe(file);

                        file.on('finish', () => {
                            console.log(`Download of "${videoTitle}" (ID: ${videoID}) is complete.`);

                            // Perform MP3 conversion using FFMPEG
                            const ffmpegProcess = exec(
                                `ffmpeg -i "${videoFileName}" -vn -ab 128k -ar 44100 -y "${audioFileName}"`,
                                (error) => {
                                    if (error) {
                                        console.error('Error converting to MP3:', error);
                                    } else {
                                        console.log(`MP3 conversion of "${videoTitle}" is complete.`);

                                        const media = MessageMedia.fromFilePath(audioFileName);
                                        client.sendMessage(message.from, media);
 
                                        // Optionally, you can delete the downloaded video file after conversion
                                        fs.unlink(videoFileName, (unlinkError) => {
                                            if (unlinkError) {
                                                console.error('Error deleting video file:', unlinkError);
                                            } else {
                                                console.log(`Deleted video file: ${videoFileName}`);
                                            }
                                        });
                                    }
                                }
                            );
                        });

                        file.on('error', (err) => {
                            console.error('Error during download:', err);
                        });
                    } catch (err) {
                        console.error('Error fetching video information:', err);
                    }
                };

                download();

            } else {
                client.sendMessage(message.from, `No video found for "${query}"`);
            }
        } catch (error) {
            console.error('Error occurred while processing search:', error);
        }
    } else {
        // Example: Reply to other types of incoming messages
        //const reply = 'Thanks for your message! This is an automated reply.';
        //client.sendMessage(message.from, reply);
        //await downloads(MessageMedia);
    }
});

client.initialize();

// Your YTSearch class (unchanged)
class YTSearch {
    async find(keyword) {
        const { videos } = await search(keyword);
        const { seconds, title, videoId, url } = this.getFirstValid(videos);
        return {
            seconds,
            title,
            videoId,
            url,
        };
    }

    getFirstValid(videos) {
        return videos.find(video => video.seconds <= 900) || null;
    }
}

// Function to download and send the video
//async function -(MessageMedia, chatId, videoId) {
//  try {
//    // Get video information using ytdl-core
//    const videoURL = `https://www.youtube.com/watch?v=${videoId}`;
//    const info = await ytdl.getInfo(videoURL);
//    const videoTitle = info.videoDetails.title;
//    const videoFileName = `${videoTitle}.mp4`;
//    const audioFileName = `${videoTitle}.mp3`;
//
//    const file = fs.createWriteStream(videoFileName);
//    ytdl(videoURL, { quality: 'highest' }).pipe(file);
//
//    file.on('finish', () => {
//      console.log(`Download of "${videoTitle}" (ID: ${videoId}) is complete.`);
//
//      // Perform MP3 conversion using FFMPEG
//      const ffmpegProcess = exec(
//        `ffmpeg -i "${videoFileName}" -vn -ab 128k -ar 44100 -y "${audioFileName}"`,
//        (error) => {
//          if (error) {
//            console.error('Error converting to MP3:', error);
//          } else {
//            console.log(`MP3 conversion of "${videoTitle}" is complete.`);
//            // Optionally, you can delete the downloaded video file after conversion
//            fs.unlink(videoFileName, (unlinkError) => {
//              if (unlinkError) {
//                console.error('Error deleting video file:', unlinkError);
//              } else {
//                console.log(`Deleted video file: ${videoFileName}`);
//              }
//            });
//
//            // Now, you can send the video through WhatsApp using the "client.sendFile()" method
//            const media = MessageMedia.fromFilePath(audioFileName);
//            client.sendMessage(chatId, media, { caption: `Check out this video: ${videoURL}` });
//          }
//        }
//      );
//    });
//
//    file.on('error', (err) => {
//      console.error('Error during download:', err);
//    });
//  } catch (err) {
//    console.error('Error fetching video information:', err);
//  }
//}


