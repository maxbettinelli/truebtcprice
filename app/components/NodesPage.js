import axios from 'axios';
import { Bar } from 'react-chartjs-2';

export default function NodesPage({ nodes }) {
  if (!nodes) {
    return <div>Loading...</div>; // Or any other fallback UI
  }
  const countries = Object.keys(nodes);
  const nodeCounts = countries.map(country => nodes[country].node_count);

  const data = {
    labels: countries,
    datasets: [
      {
        label: '# of Nodes',
        data: nodeCounts,
        backgroundColor: 'rgba(75,192,192,0.2)',
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1
      }
    ]
  };

  return (
    <div>
      <h1>Bitcoin Node Distribution</h1>
      <Bar data={data} />
    </div>
  );
}

export async function getServerSideProps() {
    try {
      const res = await axios.get('http://localhost:3001/nodes');
      const nodes = res.data;
  
      if (!nodes) {
        console.error('No data returned from API');
        return { props: {} };
      }
  
      return { props: { nodes } };
    } catch (error) {
      console.error('Error fetching data from API:', error);
      return { props: {} };
    }
  }