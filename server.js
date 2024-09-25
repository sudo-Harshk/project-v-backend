const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());

const axiosRetry = async () => {
  const module = await import('axios-retry');
  return module.default;
};

const pLimit = async () => {
  const module = await import('p-limit');
  return module.default;
};

const jobUrls = [
  { name: 'Latest Jobs', url: 'https://sarkariwallahjob.com/category/new-job/' },
  { name: 'Central Jobs', url: 'https://sarkariwallahjob.com/category/central-job/' },
  { name: 'Bank Jobs', url: 'https://sarkariwallahjob.com/category/bank-job/' },
  { name: '10th Pass Govt Jobs', url: 'https://allgovernmentjobs.in/10th-pass-govt-jobs' },
  { name: 'Intermediate Jobs', url: 'https://allgovernmentjobs.in/intermediate-10-2-jobs' },
];

const scrapeJobs = async (url, categoryName) => {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
      },
      timeout: 5000,
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    const jobs = [];

    if (categoryName === '10th Pass Govt Jobs') {
      $('.card').each((_, element) => {
        const title = $(element).find('.card-title').text().trim();
        const link = $(element).find('a').attr('href');
        const dateText = $(element).find('._ln').text().trim();
        const date = new Date(dateText);
        jobs.push({ title, link, date: isNaN(date.getTime()) ? null : date, category: categoryName });
      });
    } else if (categoryName === 'Intermediate Jobs') {
      $('.card-body').each((_, element) => {
        const title = $(element).find('.card-title').text().trim() || "No Title Available";
        const link = $(element).find('a').attr('href');
        const dateText = $(element).find('._ln').text().trim();
        const date = new Date(dateText);
        jobs.push({ title, link, date: isNaN(date.getTime()) ? null : date, category: categoryName });
      });
    } else {
      $('.elementor-post').each((_, element) => {
        const title = $(element).find('.elementor-post__title a').text().trim();
        const link = $(element).find('.elementor-post__title a').attr('href');
        const dateText = $(element).find('.elementor-post-date').text().trim();
        const date = new Date(dateText);
        jobs.push({ title, link, date: isNaN(date.getTime()) ? null : date, category: categoryName });
      });
    }

    return jobs;
  } catch (error) {
    return [];
  }
};

app.get('/', (req, res) => {
  res.send('Welcome to the Job Listings API! Navigate to /api/jobs for job data.');
});

app.get('/api/jobs', async (req, res) => {
  try {
    const limit = (await pLimit())(parseInt(process.env.CONCURRENCY_LIMIT) || 5);
    const retry = await axiosRetry();
    retry(axios, { retries: 3, retryDelay: retry.exponentialDelay });

    const startTime = Date.now();

    const jobDataPromises = jobUrls.map(({ url, name }) =>
      limit(() => scrapeJobs(url, name))
    );

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
