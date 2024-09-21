const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

const jobUrls = [
  { name: 'Latest Jobs', url: 'https://sarkariwallahjob.com/category/new-job/' },
  { name: 'Central Jobs', url: 'https://sarkariwallahjob.com/category/central-job/' },
  { name: 'Bank Jobs', url: 'https://sarkariwallahjob.com/category/bank-job/' }
  // Removed 10th Pass Jobs URL due to issues
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

        // Scrape jobs for Sarkari Wallah
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
    res.status(500).json({ error: 'Error fetching job data' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
