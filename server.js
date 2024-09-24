const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

// Load environment variables from .env file
require('dotenv').config();

const app = express();
app.use(cors());

// Use the YouTube API key from the environment variables
const youtubeApiKey = process.env.YOUTUBE_API_KEY;

const jobUrls = [
  { name: 'Latest Jobs', url: 'https://sarkariwallahjob.com/category/new-job/' },
  { name: 'Central Jobs', url: 'https://sarkariwallahjob.com/category/central-job/' },
  { name: 'Bank Jobs', url: 'https://sarkariwallahjob.com/category/bank-job/' },
  { name: '10th Pass Govt Jobs', url: 'https://allgovernmentjobs.in/10th-pass-govt-jobs' },
  { name: 'Intermediate Jobs', url: 'https://allgovernmentjobs.in/intermediate-10-2-jobs' }
];

app.get('/', (req, res) => {
  res.send('Welcome to the Job Listings API! Navigate to /api/jobs for job data.');
});

app.get('/api/jobs', async (req, res) => {
  try {
    const jobDataPromises = jobUrls.map(async (jobCategory) => {
      try {
        const response = await axios.get(jobCategory.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'
          }
        });
        const html = response.data;
        const $ = cheerio.load(html);
        const jobs = [];

        // Scrape jobs based on the job category
        if (jobCategory.name === '10th Pass Govt Jobs') {
          $('.card').each((index, element) => {
            const title = $(element).find('.card-title').text().trim();
            const link = $(element).find('a').attr('href');
            const dateText = $(element).find('._ln').text().trim();
            const date = new Date(dateText);

            jobs.push({
              title,
              link,
              date: isNaN(date.getTime()) ? null : date,
              category: jobCategory.name,
            });
          });
        } else if (jobCategory.name === 'Intermediate Jobs') {
          $('.card-body').each((index, element) => {
            const title = $(element).find('.card-title').text().trim() || "No Title Available";
            const link = $(element).find('a').attr('href');
            const dateText = $(element).find('._ln').text().trim();
            const date = new Date(dateText);

            jobs.push({
              title,
              link,
              date: isNaN(date.getTime()) ? null : date,
              category: jobCategory.name,
            });
          });                        
        } else {
          $('.elementor-post').each((index, element) => {
            const title = $(element).find('.elementor-post__title a').text().trim();
            const link = $(element).find('.elementor-post__title a').attr('href');
            const dateText = $(element).find('.elementor-post-date').text().trim();
            const date = new Date(dateText);

            jobs.push({
              title,
              link,
              date: isNaN(date.getTime()) ? null : date,
              category: jobCategory.name,
            });
          });
        }

        return jobs;
      } catch (error) {
        console.error(`Error fetching jobs from ${jobCategory.url}:`, error.message);
        return [];
      }
    });

    const jobData = await Promise.all(jobDataPromises);
    const allJobs = [].concat(...jobData);
    res.json(allJobs);
  } catch (error) {
    console.error('Error fetching job data:', error.message);
    res.status(500).json({ error: 'Error fetching job data' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
