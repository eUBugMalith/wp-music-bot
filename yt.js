const ytdl = require('ytdl-core');
const fs = require('fs');
const { exec } = require('child_process');

// Replace the video URL with the YouTube video you want to download
const videoURL = 'https://www.youtube.com/watch?v=p-UdSKOA0tg';

// Set the download options
const options = {
  quality: 'highest',
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
