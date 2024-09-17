const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio'); 
const cors = require('cors');

const app = express();
app.use(cors());

const jobUrls = [
  {
    name: 'Latest Jobs',
    url: 'https://sarkariwallahjob.com/category/new-job/',
  },
  {
    name: 'Central Jobs',
    url: 'https://sarkariwallahjob.com/category/central-job/',
  },
  {
    name: 'Bank Jobs',
    url: 'https://sarkariwallahjob.com/category/bank-job/',
  },
];

app.get('/', (req, res) => {
  res.send('Welcome to the Job Listings API! Navigate to /api/jobs for job data.');
});

app.get('/api/jobs', async (req, res) => {
  try {
    const jobDataPromises = jobUrls.map(async (jobCategory) => {
      try {
        const response = await axios.get(jobCategory.url);
        const html = response.data;
        const $ = cheerio.load(html);

        const jobs = [];

        $('.elementor-post').each((index, element) => {
          const title = $(element).find('.elementor-post__title a').text().trim();
          const link = $(element).find('.elementor-post__title a').attr('href');
          const dateText = $(element).find('.elementor-post-date').text().trim();
          const description = $(element).find('.elementor-post__excerpt p').text().trim();

          const date = new Date(dateText);

          jobs.push({
            title,
            link,
            date: isNaN(date.getTime()) ? null : date,
            description,
            category: jobCategory.name,
          });
        });

        console.log(`${jobCategory.name} fetched successfully`);
        return jobs;
      } catch (error) {
        console.error(`Error fetching ${jobCategory.name}:`, error.message);
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

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
