const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin');

// Fetch your service account credentials from the JSON file
const serviceAccount = require('./globalbtcprice-firebase-adminsdk-32b8y-4eefe979a0.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();

// Endpoint to fetch node distribution data from Bitnodes API and save in Firestore
app.get('/update-nodes', async (req, res) => {
  try {
    const { data: snapshots } = await axios.get('https://bitnodes.io/api/v1/snapshots/');
    const latestSnapshotUrl = snapshots.results[0].url; // Get the URL of the latest snapshot
    const { data: latestSnapshot } = await axios.get(latestSnapshotUrl); // Fetch the latest snapshot data

    const nodeData = latestSnapshot.nodes; // The latest snapshot data is stored in the "nodes" property

    let totalNodes = 0;
    let nodesByCountry = {};
    
    for (let node of Object.values(nodeData)) {
      const countryCode = node[8]; // node[8] holds the country code
      if (countryCode) {
        nodesByCountry[countryCode] = (nodesByCountry[countryCode] || 0) + 1;
        totalNodes++;
      }
    }

    for (let country of Object.keys(nodesByCountry)) {
      const countryNodes = nodesByCountry[country];
      const percentage = (countryNodes / totalNodes) * 100;

      const docRef = db.collection('nodes').doc(country);
      await docRef.set({
        country: country,
        node_count: countryNodes,
        percentage: Math.round(percentage * 100) / 100, // this will round it to 2 decimal places
      });
    }

    res.send('Node data updated successfully');
  } catch (error) {
    console.error('Error updating node data: ', error);
    res.status(500).send('Error updating node data');
  }
});

// Endpoint to fetch node distribution data from Firestore
app.get('/nodes', async (req, res) => {
  try {
    const nodesRef = db.collection('nodes');
    const snapshot = await nodesRef.get();

    let nodesData = {};
    snapshot.forEach(doc => {
      nodesData[doc.id] = doc.data();
    });

    res.send(nodesData);
  } catch (error) {
    console.error('Error fetching node data: ', error);
    res.status(500).send('Error fetching node data');
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
