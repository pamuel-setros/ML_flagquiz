async function fetchFlags() {
    const res = await fetch('/api/flags');
    return await res.json();
}

function kmeans(points, k = 4, maxIter = 100) {
    // points: [{avg_rgb: [r,g,b], ...}]
    let centroids = [];
    // Randomly initialize centroids
    for (let i = 0; i < k; i++) {
        centroids.push(points[Math.floor(Math.random() * points.length)].avg_rgb.slice());
    }
    let clusters = Array(points.length).fill(0);
    for (let iter = 0; iter < maxIter; iter++) {
        // Assign clusters
        for (let i = 0; i < points.length; i++) {
            let dists = centroids.map(c => Math.sqrt(
                (points[i].avg_rgb[0] - c[0]) ** 2 +
                (points[i].avg_rgb[1] - c[1]) ** 2 +
                (points[i].avg_rgb[2] - c[2]) ** 2
            ));
            clusters[i] = dists.indexOf(Math.min(...dists));
        }
        // Update centroids
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
    const colors = ['red', 'blue', 'green', 'orange'];
    let data = [];
    for (let k = 0; k < centroids.length; k++) {
        let clusterPoints = points.filter((_, i) => clusters[i] === k);
        data.push({
            x: clusterPoints.map(p => p.avg_rgb[0]),
            y: clusterPoints.map(p => p.avg_rgb[1]),
            z: clusterPoints.map(p => p.avg_rgb[2]),
            mode: 'markers',
            type: 'scatter3d',
            name: `Cluster ${k+1}`,
            marker: { size: 6, color: colors[k] }
        });
        // Lines from points to centroid
        clusterPoints.forEach(p => {
            data.push({
                x: [p.avg_rgb[0], centroids[k][0]],
                y: [p.avg_rgb[1], centroids[k][1]],
                z: [p.avg_rgb[2], centroids[k][2]],
                mode: 'lines',
                type: 'scatter3d',
                line: { color: colors[k], width: 2 },
                showlegend: false
            });
        });
    }
    // Centroids
    data.push({
        x: centroids.map(c => c[0]),
        y: centroids.map(c => c[1]),
        z: centroids.map(c => c[2]),
        mode: 'markers',
        type: 'scatter3d',
        name: 'Centroids',
        marker: { size: 12, color: colors, symbol: 'diamond' }
    });
    Plotly.newPlot('plot', data, {
        scene: {
            xaxis: {title: 'R'}, yaxis: {title: 'G'}, zaxis: {title: 'B'}
        },
        margin: {l:0, r:0, b:0, t:0}
    });
}

function renderClusters(points, clusters, k) {
    const colors = ['red', 'blue', 'green', 'orange'];
    let html = '';
    for (let i = 0; i < k; i++) {
        let clusterPoints = points.filter((_, idx) => clusters[idx] === i);
        html += `<div class="cluster"><h3 style="color:${colors[i]}">Cluster ${i+1}</h3>`;
        clusterPoints.forEach(p => {
            html += `<div><img class="flag-thumb" src="/thumbnails/${p.filename}"> ${p.state}</div>`;
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
