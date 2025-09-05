async function fetchFlags() {
    const res = await fetch('flags_data.json');
    return await res.json();
}

function kmeans(points, k = 4, maxIter = 100) {
    let centroids = [];
    for (let i = 0; i < k; i++) {
        centroids.push(points[Math.floor(Math.random() * points.length)].avg_rgb.slice());
    }
    let clusters = Array(points.length).fill(0);
    for (let iter = 0; iter < maxIter; iter++) {
        for (let i = 0; i < points.length; i++) {
            let dists = centroids.map(c => Math.sqrt(
                (points[i].avg_rgb[0] - c[0]) ** 2 +
                (points[i].avg_rgb[1] - c[1]) ** 2 +
                (points[i].avg_rgb[2] - c[2]) ** 2
            ));
            clusters[i] = dists.indexOf(Math.min(...dists));
        }
        let newCentroids = Array(k).fill().map(() => [0,0,0]);
        let counts = Array(k).fill(0);
        for (let i = 0; i < points.length; i++) {
            let c = clusters[i];
            for (let j = 0; j < 3; j++) newCentroids[c][j] += points[i].avg_rgb[j];
            counts[c]++;
        }
        for (let i = 0; i < k; i++) {
            if (counts[i] > 0) {
                for (let j = 0; j < 3; j++) newCentroids[i][j] /= counts[i];
            } else {
                newCentroids[i] = points[Math.floor(Math.random() * points.length)].avg_rgb.slice();
            }
        }
        if (JSON.stringify(centroids) === JSON.stringify(newCentroids)) break;
        centroids = newCentroids;
    }
    return {clusters, centroids};
}

function rgbToHex(rgb) {
    return '#' + rgb.map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}

function plot3D(points, clusters, centroids) {
    let data = [];
    // Points colored by their average RGB
    data.push({
        x: points.map(p => p.avg_rgb[0]),
        y: points.map(p => p.avg_rgb[1]),
        z: points.map(p => p.avg_rgb[2]),
        mode: 'markers',
        type: 'scatter3d',
        name: 'Flags',
        text: points.map(p => p.state),
        marker: {
            size: 8,
            color: points.map(p => rgbToHex(p.avg_rgb)),
            line: { width: 1, color: '#333' }
        }
    });
    // Centroids colored by their cluster's average color
    let centroidColors = centroids.map((c, k) => {
        // Find all points in cluster k
        let clusterPoints = points.filter((_, i) => clusters[i] === k);
        if (clusterPoints.length === 0) return '#000000';
        // Average their RGBs
        let avg = [0,0,0];
        clusterPoints.forEach(p => {
            for (let j = 0; j < 3; j++) avg[j] += p.avg_rgb[j];
        });
        for (let j = 0; j < 3; j++) avg[j] /= clusterPoints.length;
        return rgbToHex(avg);
    });
    data.push({
        x: centroids.map(c => c[0]),
        y: centroids.map(c => c[1]),
        z: centroids.map(c => c[2]),
        mode: 'markers',
        type: 'scatter3d',
        name: 'Centroids',
        marker: { size: 14, color: centroidColors, symbol: 'diamond' }
    });
    // Lines from points to centroid
    for (let k = 0; k < centroids.length; k++) {
        let clusterPoints = points.filter((_, i) => clusters[i] === k);
        clusterPoints.forEach(p => {
            data.push({
                x: [p.avg_rgb[0], centroids[k][0]],
                y: [p.avg_rgb[1], centroids[k][1]],
                z: [p.avg_rgb[2], centroids[k][2]],
                mode: 'lines',
                type: 'scatter3d',
                line: { color: rgbToHex(p.avg_rgb), width: 2 },
                showlegend: false
            });
        });
    }
    Plotly.newPlot('plot', data, {
        scene: {
            xaxis: {title: 'R'}, yaxis: {title: 'G'}, zaxis: {title: 'B'}
        },
        margin: {l:0, r:0, b:0, t:0}
    });
}

function renderClusters(points, clusters, k) {
    let html = '';
    for (let i = 0; i < k; i++) {
        let clusterPoints = points.filter((_, idx) => clusters[idx] === i);
        html += `<div class="cluster"><h3>Cluster ${i+1}</h3>`;
        clusterPoints.forEach(p => {
            html += `<div><img class="flag-thumb" src="thumbnails/${p.filename}"> ${p.state}</div>`;
        });
        html += '</div>';
    }
    document.getElementById('clusters').innerHTML = html;
}

fetchFlags().then(points => {
    const k = 4;
    const {clusters, centroids} = kmeans(points, k);
    plot3D(points, clusters, centroids);
    renderClusters(points, clusters, k);
});
