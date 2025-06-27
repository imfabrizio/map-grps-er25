
const subscriptionKey = 'BAqgYkgcYKIiyJfr7BOGSIFySA2Yw14pckF6xDum7uUvMptUSF19JQQJ99BFAC5RqLJioKNfAAAgAZMP45SF';

const stazioni = [
    { titolo: "Sede Croce Rossa", pos: [10.52188556692596, 44.4603971115963] },
    { titolo: "Scena CHARLIE", pos: [10.520888, 44.463778] },
    { titolo: "Scena DELTA", pos: [10.5172802, 44.4521687] },
    { titolo: "Scena ECHO", pos: [10.5186218, 44.4534773] },
    { titolo: "Scena ALFA", pos: [10.5189889, 44.4542510] },
    { titolo: "Scena BRAVO", pos: [10.5177559, 44.4555097] },
    { titolo: "Ritorno Croce Rossa", pos: [10.522, 44.4600] }
];

const map = new atlas.Map('map', {
    center: stazioni[0].pos,
    zoom: 16,
    style: 'road',
    authOptions: {
        authType: 'subscriptionKey',
        subscriptionKey: subscriptionKey
    }
});

map.events.add('ready', async function () {
    const datasource = new atlas.source.DataSource();
    map.sources.add(datasource);

    let currentPopup = null;
    stazioni.forEach((s, i) => {
        let color = (i === 0) ? 'green' : (i === stazioni.length - 1) ? 'blue' : 'red';
        const marker = new atlas.HtmlMarker({
            position: s.pos,
            htmlContent: `
                <div style="background:white;border:2px solid ${color};border-radius:6px;padding:4px 8px;box-shadow:0 0 6px rgba(0,0,0,0.5);font-size:14px;">
                    <span style="font-size:20px;">⛑️</span> <strong>${i + 1}</strong>. ${s.titolo}
                </div>`
        });
        map.markers.add(marker);

        const popup = new atlas.Popup({
            content: `<div style="padding:5px;"><strong>${i + 1}. ${s.titolo}</strong></div>`,
            position: s.pos
        });
        map.events.add('click', marker, () => {
            if (currentPopup) currentPopup.close();
            popup.open(map);
            currentPopup = popup;
        });
    });

    // Percorsi segmentati
    for (let i = 0; i < stazioni.length - 1; i++) {
        const from = stazioni[i].pos;
        const to = stazioni[i + 1].pos;

        if (i === 3) {
            // Tratto non tracciabile: linea manuale
            const manualLine = new atlas.data.Feature(new atlas.data.LineString([from, to]));
            datasource.add(manualLine);
            continue;
        }

        const travelMode = (i < 2) ? 'car' : 'pedestrian';
        const routeUrl = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&subscription-key=${subscriptionKey}` +
            `&query=${from[1]},${from[0]}:${to[1]},${to[0]}&travelMode=${travelMode}`;

        const res = await fetch(routeUrl);
        const data = await res.json();

        const routeCoords = data.routes[0].legs.flatMap(leg => leg.points.map(p => [p.longitude, p.latitude]));
        const routeLine = new atlas.data.Feature(new atlas.data.LineString(routeCoords));
        datasource.add(routeLine);
    }

    const routeLayer = new atlas.layer.LineLayer(datasource, null, {
        strokeColor: 'deepskyblue',
        strokeWidth: 4
    });
    map.layers.add(routeLayer);
});

// Cambia stile mappa
const styleSelector = document.getElementById('mapStyleSelect');
styleSelector.addEventListener('change', () => {
    map.setStyle(styleSelector.value);
});

// Navigazione verso punto
function vaiAPunto(coord, label) {
    map.setCamera({ center: coord, zoom: 18 });

    if (/Mobi|Android/i.test(navigator.userAgent)) {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const mapsUrl = isIOS
            ? `http://maps.apple.com/?daddr=${coord[1]},${coord[0]}&dirflg=w`
            : `https://www.google.com/maps/dir/?api=1&destination=${coord[1]},${coord[0]}&travelmode=walking`;

        window.open(mapsUrl, '_blank');
    }
}
