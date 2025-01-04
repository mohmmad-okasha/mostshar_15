import Axios from "axios";
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import dayjs from "dayjs";

export const generateAccountNumber = async (parentAccount) => {

  let newAccountNumber = 0;

  try {
    const config = {//to stop caching
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache', // For HTTP/1.0 compatibility
        'Expires': '0', // Ensures the content is considered expired
      },
    };

    if (parentAccount === 'Main') {
      // Fetch max main account number
      const { data: maxAccountNumber } = await Axios.get(
        `${api}/accounts/maxAccountNumber`, config
      );

      newAccountNumber = maxAccountNumber + 1;
    } else {
      // Fetch max child account number
      const { data: maxChildAccountNumber } = await Axios.get(
        `${api}/accounts/maxChildAccountNumber/${parentAccount}`, config
      );
      //console.log('parentAccount '+parentAccount)

      if (maxChildAccountNumber === 'first') {
        console.log(getAccountNumberByName(parentAccount))
        newAccountNumber = parseInt(await getAccountNumberByName(parentAccount)) * 10 + 1; // First child account number
      } else {
        newAccountNumber = parseInt(maxChildAccountNumber) + 1; // Increment existing child account number
      }
    }

    return newAccountNumber.toString();
  } catch (error) {
    console.error('Error generating account number:', error);
    throw new Error('Unable to generate account number ' + error);
  }
};

export const getMaxChildAccountNumber = async (accountNumber) => {
  const response = await Axios.get(`${api}/accounts/maxChildAccountNumber/${accountNumber}`);
  return response.data;
};

export const getAccountNumberByName = async (accountNumber) => {
  const response = await Axios.get(`${api}/accounts/getAccountNumberByName/${accountNumber}`);
  return response.data;
};

export const exportToExcel = (divId) => {
  const wb = XLSX.utils.table_to_book(document.getElementById(divId));
  XLSX.writeFile(wb, divId + '.xlsx');
};

export const exportToWord = (divId) => {
  const divContent = document.getElementById(divId).innerHTML;
  const wordContent = `<html><body>${divContent}</body></html>`;

  const blob = new Blob([wordContent], { type: 'application/msword' });

  saveAs(blob, divId);
};

export const getApiUrl = (req) => {
  let host;

  if (typeof req !== 'undefined') {
    // Server-side detection
    host = req.headers.host;
  } else if (typeof window !== 'undefined') {
    // Client-side detection
    host = window.location.host;
  }

  // Determine if running in a local environment
  const isLocal = host && (host.includes('localhost') || host.includes('127.0.0.1'));

  const baseUrl = isLocal ? 'http://localhost:3001' : 'https://mostshar-15-server.vercel.app';

  return baseUrl
};

const api = getApiUrl();

export const getRules = async (userName, PageName) => {
  const response = await Axios.get(`${api}/users/${userName}`);
  let rules = response.data.rules;

  if (PageName) {
    rules = rules[PageName]
  }

  return rules
};

export async function getSettings(userName) {
  try {
    const response = await Axios.get(`${api}/users/${userName}`);
    return response.data.settings;
  } catch (error) {
    console.error("Error fetching logs:", error);
  }
}

export const handlePrint = (tableRef, title, fontSize, lang) => {
  if (tableRef.current) {
    const printContents = tableRef.current.innerHTML;
    const printWindow = window.open("", "", "height=2000,width=2000");

    if (printWindow) {
      printWindow.document.write("<html><head><title>Print Report</title>");
      printWindow.document.write(`
        <style>
            @font-face {
              font-family: 'NotoSansArabic'; 
              src: local('NotoSansArabic'), url('/reports/NotoSansArabic-Regular.ttf') format('truetype'); 
              font-weight: normal;
              font-style: normal;
            }
            body {
              font-family: 'NotoSansArabic', Arial, sans-serif;
              direction: ${lang === 'ar' ? 'rtl' : 'ltr'};
            }
            .top {
              border-top: 12px solid #098290 !important;
              top: -20px !important;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 0.5rem;
              color: #212529;
              background-color: transparent;
              font-size: ${fontSize}px; /* Default font size */
            }
            th, td {
              padding: 0.75rem;
              vertical-align: top;
              border-top: 1px solid #dee2e6;
              text-align: ${lang === 'ar' ? 'right' : 'center'};
               text-align: center !important;
            }
            thead th {
              vertical-align: bottom;
              border-bottom: 2px solid #dee2e6;
            }
            tbody + tbody {
              border-top: 2px solid #dee2e6;
            }
            .table-bordered {
              border: 1px solid #dee2e6;
            }
            .table-bordered th,
            .table-bordered td {
              border: 1px solid #dee2e6;
            }
            .table-striped tbody tr:nth-of-type(odd) {
              background-color: rgba(0, 0, 0, 0.05);
            }
            .no_print, button, .ant-collapse-header {
              display: none;
            }
            @media print {
              @page {
                size: auto;
                margin: 3mm;
              }
              .no_print {
                display: none;
              }
              #center {
                text-align: center !important;
              }
              body {
                margin: 0;
                padding: 0;
              }
              #print-table {
                width: 100%;
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              table {
                font-size: ${fontSize}px;
              }
              th, td {
                padding: 0.75rem;
                vertical-align: top;
                border-top: 1px solid #dee2e6;
                text-align: ${lang === 'ar' ? 'right' : 'left'};
              }
            }
          </style>
      `);
      printWindow.document.write("</head><body>");
      printWindow.document.write(`
        <div class="top" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; font-size:10px">
          <div style="display: flex; align-items: center;">
            <div>
              <div><h2>MOSTSHAR APP</h2></div>
              <div><img src="https://cdn-icons-png.flaticon.com/128/3781/3781607.png" width="4%"/> 00962790303111 </div>
              <div><img src="https://cdn-icons-png.flaticon.com/128/3781/3781605.png" width="4%"/> info@crown_tourism.com</div>
              <div><img src="https://cdn-icons-png.flaticon.com/128/1216/1216844.png" width="4%"/> Amman-Jordan</div>
            </div>
          </div>
          <img src="/reports/logo.png" alt="Company Logo" style="width: 100px;">
        </div>
      `);
      printWindow.document.write(`<h4 style="text-align: center;">${title}</h4>`);
      printWindow.document.write('<div id="print-table">');
      printWindow.document.write(printContents);
      printWindow.document.write("</div>");
      printWindow.document.write("</body></html>");

      printWindow.document.close();
      printWindow.print();
      setTimeout(function () {
        printWindow.close();
      }, 2000); // Close after 2 seconds
    }
  }
};

export const cardPrint = (cardRef, title) => {
  if (cardRef.current) {
    const printContents = cardRef.current.innerHTML;
    const printWindow = window.open("", "", "height=2000,width=2000");

    if (printWindow) {
      printWindow.document.write("<html><head><title>Print Report</title>");
      printWindow.document.write(`

            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.3.1/dist/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">        <style>
           
            @font-face {
              font-family: 'NotoSansArabic'; 
              src: local('NotoSansArabic'), url('/reports/NotoSansArabic-Regular.ttf') format('truetype'); 
              font-weight: normal;
              font-style: normal;
            }
            body {
              font-family: 'NotoSansArabic', Arial, sans-serif;
            }
            .top{
              border-top: 12px solid #098290 !important;
              top: -20px !important;
            }
            .no_print{
              display:none
            }
            @media print {
              @page {
                size: auto;
                margin: 3mm;
              }
              .no_print{
                display:none
              }
              #center{
                text-align: center !important;
              }
              body {
                margin: 0;
                padding: 0;
              }
              .title_text{
              font-size:14px 
              }
            }
          </style>
       
      `);
      printWindow.document.write("</head><body>");
      printWindow.document.write(`
        <div class="top" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; font-size:10px">
          <div style="display: flex; align-items: center;">
            <div>
              <div><h2>MOSTSHAR APP</h2></div>
              <div class='title_text'><img src="https://cdn-icons-png.flaticon.com/128/3781/3781607.png" width="4%"/> 00962790303111 </div>
              <div class='title_text'><img src="https://cdn-icons-png.flaticon.com/128/3781/3781605.png" width="4%"/> info@crown_tourism.com</div>
              <div class='title_text'><img src="https://cdn-icons-png.flaticon.com/128/1216/1216844.png" width="4%"/> Amman-Jordan</div>
            </div>
          </div>
          <img src="/reports/logo.png" alt="Company Logo" style="width: 150px;">
        </div>
      `);
      printWindow.document.write(`<h4 style="text-align: center;">${title}</h4>`);
      printWindow.document.write('<div id="print-table">');
      printWindow.document.write(printContents);
      printWindow.document.write("</div>");
      printWindow.document.write("</body></html>");

      printWindow.document.close();
      printWindow.print();
      setTimeout(function () {
        printWindow.close();
      }, 2000); // Close after 1 second
    }
  }
};

export const saveLog = async (log) => {
  const response = await Axios.post(`${api}/logs`, {
    userName: window.localStorage.getItem("userName"),
    log: log,
    time: new Date(),
  });
};

export function capitalize(str) {
  //abc => Abc
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const cardStyle = {
  //maxHeight: "100vh",
  paddingBottom: 0,
  boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.05)",
};

export function formatDate(value) {
  if (value instanceof Date) {
    return value.toLocaleDateString() + " " + value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else {
    return value;
  }
}

export function formatDateDayjs(value) {
  return dayjs(value).format('YYYY-MM-DD');
}

export const getSearchText = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("searchText") || "";
  }
  return "";
};

export const setSearchText = (text) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("searchText", text);
  }
};

export function getDatesInRange(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  while (currentDate <= end) {
    dates.push(new Date(dayjs(currentDate).format('YYYY-MM-DD')));
    currentDate += 86400000; // Add one day in milliseconds
  }

  return dates;
}
