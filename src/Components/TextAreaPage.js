import React, { useState } from 'react';
import { Button, Container, Row, Col, Spinner } from 'react-bootstrap';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './TextAreaPage.css';

function TextAreaPage() {
  const [text, setText] = useState('');
  const [jsonData, setJsonData] = useState([]);
  const [queryProcessFlag, setQueryProcessFlag] = useState(false)
  const [queries, setQueries] = useState([])
  const [queryCount, setQueryCount] = useState(0);
  const [loading, setLoading] = useState(false)
  const excelFileName = 'Data.xlsx';

  const handleTextChange = (event) => {
    setText(event.target.value);
  };

  const processQuery = async (query, nextPageToken = null, newJsonData) => {
    const params = { query };
    if (nextPageToken) {
      params.next_page_token = nextPageToken;
    }

    try {
    const response = await axios
      .get('https://google-maps-scraper-btyra.ondigitalocean.app', { params })
    const responseData = response.data.results.map((result) => ({ Query: query, ...result  }))
    setJsonData([...newJsonData, ...responseData]);
    newJsonData = [...newJsonData, ...responseData]
    if (response.data.next_page_token) {
        // If there is a next_page_token, recursively fetch the next page
        newJsonData = processQuery(query, response.data.next_page_token, newJsonData);
    }
    } catch (error) {
        console.error('Error fetching data from the API:', error);
    }
      
    return newJsonData;
  };

  const processText = async () => {
    setLoading(true)
    setQueryProcessFlag(true);
    const queries = text.split('\n');
    setQueries(queries)
    setJsonData([]);
    let newJsonData = [];
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i].trim();
      console.log(`processing query ${query}`)
      if (query) {
        newJsonData = await processQuery(query, null, newJsonData);
        setQueryCount(i+1)
      }
    }
    setLoading(false)
  };

  function convertJSONToExcel(jsonData, excelFileName) {
    
    // Create a new worksheet
    const ws = XLSX.utils.json_to_sheet(jsonData);
  
    // Create a new workbook with the worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  
    // Generate an Excel file in binary format
    const excelData = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
  
    // Convert the binary Excel data to a Blob
    const blob = new Blob([s2ab(excelData)], { type: 'application/octet-stream' });
  
    // Create a download link for the Excel file
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = excelFileName;
    
  
    // Trigger a click event on the download link to start the download
    downloadLink.click();
  }

  function s2ab(s) {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) {
      view[i] = s.charCodeAt(i) & 0xff;
    }
    return buf;
  }


  const saveAsExcel = () => {
    convertJSONToExcel(jsonData, excelFileName);
  };

  return (
    <Container className="text-center my-5">
    <h1 style={{marginTop : '0.5%', fontSize: '30px'}} className="mx-4 text-center">Google Maps Scraper</h1>
    <Row className="justify-content-center">
      <Col xs={12} md={6}>
        <div className="text-area-container">
          <h3 style={{textAlign : 'center', fontSize: '20px'}} className="text-center">Enter your queries line by line</h3>
          <textarea
            className="custom-textarea"
            value={text}
            onChange={handleTextChange}
          />
        </div>
      </Col>
    </Row>
    <Row className="justify-content-center my-4">
      <Col xs="auto" className="d-flex justify-content-between">
      {loading ? ( // Conditionally render Spinner when loading is true
            <Spinner animation="border" role="status">
              <span className="sr-only">Loading...</span>
            </Spinner>
          ) : (
            <Button onClick={processText} variant="primary" className="process-button">
              Process
            </Button>
          )}
        </Col>
        {jsonData.length > 0 && (
          <Col xs="auto">
            <Button onClick={saveAsExcel} variant="primary" className="process-button">
              Download Excel
            </Button>
        </Col>
      )}
    </Row>
    {queryProcessFlag? (
      <h2 style={{fontSize: '15px', textAlign : 'center'}} className="text-center">Queries Processed : {queryCount} of {queries.length}</h2>
    ): null}
  </Container>
  );
}

export default TextAreaPage;
