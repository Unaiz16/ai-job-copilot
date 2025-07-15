// Browserless.io service for web automation
// Handles job application automation, form filling, and web scraping

import config from '../config/environment.js';

class BrowserlessService {
  constructor() {
    this.apiKey = '2ScPWInlwijme789fa327905e827c9f18bcbf40355a447270';
    this.baseUrl = 'https://chrome.browserless.io';
    this.timeout = 30000; // 30 seconds
  }

  // Core automation methods
  async createSession() {
    try {
      const response = await fetch(`${this.baseUrl}/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timeout: this.timeout,
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      const session = await response.json();
      return session.id;
    } catch (error) {
      console.error('Error creating Browserless session:', error);
      throw error;
    }
  }

  async executeScript(sessionId, script) {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          script: script,
          timeout: this.timeout
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to execute script: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error executing script:', error);
      throw error;
    }
  }

  async closeSession(sessionId) {
    try {
      await fetch(`${this.baseUrl}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
    } catch (error) {
      console.error('Error closing session:', error);
    }
  }

  // Job application automation methods
  async detectApplicationType(jobUrl) {
    const sessionId = await this.createSession();
    
    try {
      const script = `
        (async () => {
          await page.goto('${jobUrl}', { waitUntil: 'networkidle2' });
          
          // Check for Easy Apply buttons
          const easyApplySelectors = [
            '[data-automation-id="job-apply-button"]', // StepStone
            '.jobs-apply-button', // LinkedIn
            '.apply-button-enabled', // Indeed
            '[data-testid="apply-button"]', // Xing
            '.easy-apply-button',
            '.one-click-apply'
          ];
          
          let isEasyApply = false;
          let applyButtonSelector = null;
          
          for (const selector of easyApplySelectors) {
            const element = await page.$(selector);
            if (element) {
              isEasyApply = true;
              applyButtonSelector = selector;
              break;
            }
          }
          
          // Get job details
          const jobTitle = await page.$eval('h1, .job-title, [data-automation-id="job-title"]', 
            el => el.textContent.trim()).catch(() => 'Unknown');
          
          const company = await page.$eval('.company-name, [data-automation-id="company-name"], .jobs-unified-top-card__company-name', 
            el => el.textContent.trim()).catch(() => 'Unknown');
          
          const location = await page.$eval('.location, [data-automation-id="job-location"], .jobs-unified-top-card__bullet', 
            el => el.textContent.trim()).catch(() => 'Unknown');
          
          // Check for required fields
          const requiredFields = await page.$$eval('input[required], select[required], textarea[required]', 
            elements => elements.map(el => ({
              type: el.type,
              name: el.name,
              placeholder: el.placeholder,
              required: el.required
            })));
          
          return {
            isEasyApply,
            applyButtonSelector,
            jobTitle,
            company,
            location,
            requiredFields,
            url: page.url()
          };
        })();
      `;
      
      const result = await this.executeScript(sessionId, script);
      return result;
    } finally {
      await this.closeSession(sessionId);
    }
  }

  async performEasyApply(jobUrl, profileData) {
    const sessionId = await this.createSession();
    
    try {
      const script = `
        (async () => {
          await page.goto('${jobUrl}', { waitUntil: 'networkidle2' });
          
          const results = {
            success: false,
            steps: [],
            error: null
          };
          
          try {
            // Step 1: Click apply button
            const applySelectors = [
              '[data-automation-id="job-apply-button"]',
              '.jobs-apply-button',
              '.apply-button-enabled',
              '[data-testid="apply-button"]',
              '.easy-apply-button'
            ];
            
            let applyButton = null;
            for (const selector of applySelectors) {
              applyButton = await page.$(selector);
              if (applyButton) break;
            }
            
            if (!applyButton) {
              throw new Error('Apply button not found');
            }
            
            await applyButton.click();
            results.steps.push('Clicked apply button');
            await page.waitForTimeout(2000);
            
            // Step 2: Fill application form
            const profileData = ${JSON.stringify(profileData)};
            
            // Fill name fields
            const nameSelectors = ['input[name*="name"]', 'input[placeholder*="Name"]', '#name', '.name-input'];
            for (const selector of nameSelectors) {
              const element = await page.$(selector);
              if (element) {
                await element.clear();
                await element.type(profileData.name || '');
                results.steps.push('Filled name field');
                break;
              }
            }
            
            // Fill email fields
            const emailSelectors = ['input[type="email"]', 'input[name*="email"]', '#email', '.email-input'];
            for (const selector of emailSelectors) {
              const element = await page.$(selector);
              if (element) {
                await element.clear();
                await element.type(profileData.email || '');
                results.steps.push('Filled email field');
                break;
              }
            }
            
            // Fill phone fields
            const phoneSelectors = ['input[type="tel"]', 'input[name*="phone"]', '#phone', '.phone-input'];
            for (const selector of phoneSelectors) {
              const element = await page.$(selector);
              if (element) {
                await element.clear();
                await element.type(profileData.phone || '');
                results.steps.push('Filled phone field');
                break;
              }
            }
            
            // Upload CV if file upload is present
            const fileInputs = await page.$$('input[type="file"]');
            if (fileInputs.length > 0 && profileData.cvPath) {
              // Note: In real implementation, we'd need to handle file upload
              results.steps.push('CV upload field detected');
            }
            
            // Fill cover letter
            const coverLetterSelectors = ['textarea[name*="cover"]', 'textarea[placeholder*="cover"]', '.cover-letter'];
            for (const selector of coverLetterSelectors) {
              const element = await page.$(selector);
              if (element) {
                await element.clear();
                await element.type(profileData.coverLetter || '');
                results.steps.push('Filled cover letter');
                break;
              }
            }
            
            // Step 3: Submit application (in review mode, we don't actually submit)
            const submitSelectors = [
              'button[type="submit"]',
              '.submit-button',
              '[data-automation-id="submit-application"]',
              '.apply-submit'
            ];
            
            let submitButton = null;
            for (const selector of submitSelectors) {
              submitButton = await page.$(selector);
              if (submitButton) break;
            }
            
            if (submitButton) {
              results.steps.push('Submit button found - ready for submission');
              // In autonomous mode, we would click here:
              // await submitButton.click();
              // results.steps.push('Application submitted');
            }
            
            results.success = true;
            
          } catch (error) {
            results.error = error.message;
          }
          
          return results;
        })();
      `;
      
      const result = await this.executeScript(sessionId, script);
      return result;
    } finally {
      await this.closeSession(sessionId);
    }
  }

  async performComplexApply(jobUrl, profileData) {
    const sessionId = await this.createSession();
    
    try {
      const script = `
        (async () => {
          await page.goto('${jobUrl}', { waitUntil: 'networkidle2' });
          
          const results = {
            success: false,
            steps: [],
            formFields: [],
            error: null
          };
          
          try {
            // Step 1: Navigate to application page
            const applySelectors = [
              'a[href*="apply"]',
              '.apply-link',
              '[data-automation-id="job-apply-button"]'
            ];
            
            let applyLink = null;
            for (const selector of applySelectors) {
              applyLink = await page.$(selector);
              if (applyLink) break;
            }
            
            if (applyLink) {
              await applyLink.click();
              results.steps.push('Navigated to application page');
              await page.waitForTimeout(3000);
            }
            
            // Step 2: Analyze form structure
            const formFields = await page.$$eval('input, select, textarea', elements => 
              elements.map(el => ({
                type: el.type,
                name: el.name,
                id: el.id,
                placeholder: el.placeholder,
                required: el.required,
                options: el.tagName === 'SELECT' ? 
                  Array.from(el.options).map(opt => opt.text) : null
              }))
            );
            
            results.formFields = formFields;
            results.steps.push(\`Found \${formFields.length} form fields\`);
            
            // Step 3: Fill form intelligently
            const profileData = ${JSON.stringify(profileData)};
            
            for (const field of formFields) {
              try {
                let selector = field.id ? \`#\${field.id}\` : \`[name="\${field.name}"]\`;
                const element = await page.$(selector);
                
                if (!element) continue;
                
                // Determine what to fill based on field characteristics
                let valueToFill = '';
                
                if (field.type === 'email' || field.name?.includes('email')) {
                  valueToFill = profileData.email || '';
                } else if (field.type === 'tel' || field.name?.includes('phone')) {
                  valueToFill = profileData.phone || '';
                } else if (field.name?.includes('name') || field.placeholder?.includes('Name')) {
                  valueToFill = profileData.name || '';
                } else if (field.name?.includes('experience')) {
                  valueToFill = profileData.yearsOfExperience || '';
                } else if (field.name?.includes('skills')) {
                  valueToFill = profileData.keySkills || '';
                } else if (field.type === 'textarea') {
                  valueToFill = profileData.summary || '';
                }
                
                if (valueToFill && field.type !== 'file') {
                  await element.clear();
                  await element.type(valueToFill);
                  results.steps.push(\`Filled \${field.name || field.id}\`);
                }
                
              } catch (fieldError) {
                results.steps.push(\`Error filling \${field.name}: \${fieldError.message}\`);
              }
            }
            
            results.success = true;
            
          } catch (error) {
            results.error = error.message;
          }
          
          return results;
        })();
      `;
      
      const result = await this.executeScript(sessionId, script);
      return result;
    } finally {
      await this.closeSession(sessionId);
    }
  }

  // Job search automation
  async searchJobs(platform, searchParams) {
    const sessionId = await this.createSession();
    
    try {
      let searchUrl = '';
      
      switch (platform) {
        case 'stepstone.de':
          searchUrl = `https://www.stepstone.de/jobs/${encodeURIComponent(searchParams.keywords)}/${encodeURIComponent(searchParams.location)}`;
          break;
        case 'indeed.de':
          searchUrl = `https://de.indeed.com/jobs?q=${encodeURIComponent(searchParams.keywords)}&l=${encodeURIComponent(searchParams.location)}`;
          break;
        case 'xing.de':
          searchUrl = `https://www.xing.com/jobs/search?keywords=${encodeURIComponent(searchParams.keywords)}&location=${encodeURIComponent(searchParams.location)}`;
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
      
      const script = `
        (async () => {
          await page.goto('${searchUrl}', { waitUntil: 'networkidle2' });
          
          const jobs = [];
          
          // Platform-specific selectors
          let jobSelectors = {};
          
          if (page.url().includes('stepstone.de')) {
            jobSelectors = {
              container: '[data-testid="job-item"]',
              title: '[data-testid="job-title"]',
              company: '[data-testid="company-name"]',
              location: '[data-testid="job-location"]',
              link: '[data-testid="job-title"] a'
            };
          } else if (page.url().includes('indeed.de')) {
            jobSelectors = {
              container: '.job_seen_beacon',
              title: '.jobTitle a',
              company: '.companyName',
              location: '.companyLocation',
              link: '.jobTitle a'
            };
          } else if (page.url().includes('xing.com')) {
            jobSelectors = {
              container: '.job-card',
              title: '.job-title',
              company: '.company-name',
              location: '.job-location',
              link: '.job-title a'
            };
          }
          
          const jobElements = await page.$$(jobSelectors.container);
          
          for (let i = 0; i < Math.min(jobElements.length, 20); i++) {
            try {
              const jobElement = jobElements[i];
              
              const title = await jobElement.$eval(jobSelectors.title, el => el.textContent.trim()).catch(() => '');
              const company = await jobElement.$eval(jobSelectors.company, el => el.textContent.trim()).catch(() => '');
              const location = await jobElement.$eval(jobSelectors.location, el => el.textContent.trim()).catch(() => '');
              const link = await jobElement.$eval(jobSelectors.link, el => el.href).catch(() => '');
              
              if (title && company) {
                jobs.push({
                  title,
                  company,
                  location,
                  link,
                  platform: '${platform}',
                  scrapedAt: new Date().toISOString()
                });
              }
            } catch (error) {
              console.log(\`Error processing job \${i}: \${error.message}\`);
            }
          }
          
          return jobs;
        })();
      `;
      
      const result = await this.executeScript(sessionId, script);
      return result;
    } finally {
      await this.closeSession(sessionId);
    }
  }

  // Test automation capabilities
  async testAutomation() {
    try {
      const sessionId = await this.createSession();
      
      const script = `
        (async () => {
          await page.goto('https://example.com', { waitUntil: 'networkidle2' });
          const title = await page.title();
          return { success: true, title, timestamp: new Date().toISOString() };
        })();
      `;
      
      const result = await this.executeScript(sessionId, script);
      await this.closeSession(sessionId);
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new BrowserlessService();

