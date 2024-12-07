import React, { useState, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { 
  Container, 
  Card, 
  Title, 
  Button, 
  Group, 
  NumberInput, 
  Table, 
} from '@mantine/core';

// Type definitions
interface Point {
  x: number;
  y: number;
  cluster?: number;
  name: string;
}

interface Centroid {
  x: number;
  y: number;
}

// Main Component
const KMeansClusterer: React.FC = () => {
  // State Management
  const [points, setPoints] = useState<Point[]>([]);
  const [clusters, setClusters] = useState<number>(2);
  const [centroids, setCentroids] = useState<Centroid[]>([]);
  const [clusterColors, setClusterColors] = useState<string[]>([]);
  const [iterationHistory, setIterationHistory] = useState<{
    points: Point[];
    centroids: Centroid[];
  }[]>([]);
  const [currentIteration, setCurrentIteration] = useState<number>(0);
  const [isConverged, setIsConverged] = useState<boolean>(false);

  // SVG Configuration
  const svgRef = useRef<SVGSVGElement>(null);
  const width = window.innerWidth - 40;
  const height = 400;
  const margin = { top: 40, right: 40, bottom: 40, left: 40 };

  // Scales for visualization
  const xScale = d3.scaleLinear()
    .domain([0, 13])
    .range([margin.left, width - margin.right]);

  const yScale = d3.scaleLinear()
    .domain([0, 10])
    .range([height - margin.bottom, margin.top]);

  // Utility Functions
  const calculateDistance = (p1: Point | Centroid, p2: Centroid): number => {
    return Math.sqrt(
      Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
    );
  };

  const generateRandomColors = (k: number): string[] => {
    return Array.from({ length: k }, () => 
      `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`
    );
  };

  // Clustering Methods
  const initializeCentroids = () => {
    // Randomly select initial centroids
    const initialCentroids = points
      .sort(() => 0.5 - Math.random())
      .slice(0, clusters)
      .map(p => ({ x: p.x, y: p.y }));

    setCentroids(initialCentroids);
    setClusterColors(generateRandomColors(clusters));
    setCurrentIteration(0);
    setIsConverged(false);
    setIterationHistory([]);
  };

  const performKMeansIteration = useCallback(() => {
    if (points.length === 0 || centroids.length === 0) return;

    // Save current state to history
    setIterationHistory(prev => [
      ...prev, 
      { points, centroids }
    ]);

    // Calculate distances to centroids
    const distances = points.map(point => 
      centroids.map(centroid => calculateDistance(point, centroid))
    );

    // Assign points to nearest centroid
    const labels = distances.map(d => d.indexOf(Math.min(...d)));

    // Recalculate centroids
    const newCentroids = centroids.map((_, clusterIndex) => {
      const clusterPoints = points.filter((_, i) => labels[i] === clusterIndex);
      
      if (clusterPoints.length === 0) return centroids[clusterIndex];

      return {
        x: clusterPoints.reduce((sum, p) => sum + p.x, 0) / clusterPoints.length,
        y: clusterPoints.reduce((sum, p) => sum + p.y, 0) / clusterPoints.length,
      };
    });

    // Mark points with cluster assignments
    const newPoints = points.map((point, index) => ({
      ...point,
      cluster: labels[index]
    }));

    // Check for convergence
    const hasConverged = newCentroids.every(
      (centroid, i) => 
        Math.abs(centroid.x - centroids[i].x) < 0.001 && 
        Math.abs(centroid.y - centroids[i].y) < 0.001
    );

    // Update states
    setCentroids(newCentroids);
    setPoints(newPoints);
    setCurrentIteration(prev => prev + 1);

    if (hasConverged) {
      setIsConverged(true);
    }
  }, [points, centroids]);

  const revertToPreviousIteration = () => {
    if (iterationHistory.length > 0) {
      const lastState = iterationHistory[iterationHistory.length - 1];
      
      setCentroids(lastState.centroids);
      setPoints(lastState.points);
      
      setIterationHistory(prev => prev.slice(0, -1));
      setCurrentIteration(prev => Math.max(0, prev - 1));
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const [mouseX, mouseY] = d3.pointer(e);
    const x = Math.round(xScale.invert(mouseX));
    const y = Math.round(yScale.invert(mouseY));

    if (x >= 0 && x <= 10 && y >= 0 && y <= 10) {
      setPoints(prev => [
        ...prev, 
        { x, y, name: `p${prev.length + 1}` }
      ]);
    }
  };

  const resetClustering = () => {
    setPoints([]);
    setCentroids([]);
    setClusterColors([]);
    setIterationHistory([]);
    setCurrentIteration(0);
    setIsConverged(false);
  };

  return (
    <Container size="lg">
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={3} mb="md">K-Means Clustering</Title>
        
        <Group mb="md">
          <NumberInput
            label="Number of Clusters"
            value={clusters}
            onChange={(value) => setClusters(Number(value))}
            min={1}
            max={10}
          />
          <Button
            onClick={initializeCentroids}
            disabled={points.length < clusters}
            color="blue"
          >
            Initialize
          </Button>
          <Button
            onClick={performKMeansIteration}
            disabled={isConverged || centroids.length === 0}
            color="green"
          >
            Next Iteration
          </Button>
          <Button
            onClick={revertToPreviousIteration}
            disabled={iterationHistory.length === 0}
            color="orange"
          >
            Previous Iteration
          </Button>
          <Button
            onClick={resetClustering}
            color="red"
          >
            Reset
          </Button>
        </Group>

        <svg
          ref={svgRef}
          width={width}
          height={height}
          onMouseDown={handleMouseDown}
          style={{ border: "1px solid #ccc", width: "100%" }}
        >
          {/* Gridlines */}
          <g>
            {xScale.ticks(10).map((tick) => (
              <line
                key={`x-${tick}`}
                x1={xScale(tick)}
                x2={xScale(tick)}
                y1={margin.top}
                y2={height - margin.bottom}
                stroke="#e0e0e0"
              />
            ))}
            {yScale.ticks(10).map((tick) => (
              <line
                key={`y-${tick}`}
                x1={margin.left}
                x2={width - margin.right}
                y1={yScale(tick)}
                y2={yScale(tick)}
                stroke="#e0e0e0"
              />
            ))}
          </g>

          {/* Axes Labels */}
          <g>
            {xScale.ticks(10).map((tick) => (
              <text
                key={`x-label-${tick}`}
                x={xScale(tick)}
                y={height - margin.bottom + 20}
                fontSize="12"
                textAnchor="middle"
                fill="white"
              >
                {tick}
              </text>
            ))}
            {yScale.ticks(10).map((tick) => (
              <text
                key={`y-label-${tick}`}
                x={margin.left - 20}
                y={yScale(tick)}
                fontSize="12"
                textAnchor="end"
                fill="white"
              >
                {tick}
              </text>
            ))}
          </g>

          {/* Data Points */}
          {points.map((point, index) => (
            <circle
              key={`point-${index}`}
              cx={xScale(point.x)}
              cy={yScale(point.y)}
              r={5}
              fill={point.cluster !== undefined ? clusterColors[point.cluster] : 'var(--mantine-color-blue-6)'}
              stroke="black"
              strokeWidth={1}
            />
          ))}

          {/* Centroids */}
          {centroids.map((centroid, index) => (
            <circle
              key={`centroid-${index}`}
              cx={xScale(centroid.x)}
              cy={yScale(centroid.y)}
              r={10}
              fill="red"
              stroke="black"
              strokeWidth={2}
            />
          ))}
        </svg>

        {/* Iteration Information */}
        <div>
          <Title order={4} mt="md">
            Iteration: {currentIteration}
          </Title>
          <Table striped highlightOnHover withTableBorder>
            <thead>
              <tr>
                <th>Point</th>
                <th>X</th>
                <th>Y</th>
                <th>Cluster</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point, index) => (
                <tr key={`table-row-${index}`}>
                  <td style={{textAlign:'center'}} >{point.name}</td>
                  <td style={{textAlign:'center'}}>{point.x.toFixed(2)}</td>
                  <td style={{textAlign:'center'}}>{point.y.toFixed(2)}</td>
                  <td style={{textAlign:'center'}}>{point.cluster !== undefined ? point.cluster + 1 : 'Unassigned'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
    </Container>
  );
};

export default KMeansClusterer;