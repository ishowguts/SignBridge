// Renders report/report.html to report/SignBridge_Project_Report.pdf with running header/footer.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + path.resolve(__dirname, '../report/report.html'), { waitUntil: 'networkidle' });
  await p.pdf({
    path: path.resolve(__dirname, '../report/SignBridge_Project_Report.pdf'), format: 'A4', printBackground: true,
    displayHeaderFooter: true, margin: { top: '22mm', bottom: '20mm', left: '18mm', right: '18mm' },
    headerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#555;font-family:Times New Roman">SIGNBRIDGE — REAL-TIME INDIAN SIGN LANGUAGE RECOGNITION</div>',
    footerTemplate: '<div style="font-size:8px;width:100%;text-align:right;padding-right:18mm;color:#555;font-family:Times New Roman">Project Report Page <span class="pageNumber"></span></div>',
  });
  await b.close();
})();
