import proj4 from 'proj4';
import type { Converter } from 'proj4';
import { Vector3 } from 'three';

import Instance from '@giro3d/giro3d/core/Instance.js';
import * as MemoryUsage from '@giro3d/giro3d/core/MemoryUsage.js';

const VIEW_PARAM = 'view';
let currentURL = '';

const NUMBER_FORMAT = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

const LATLON_FORMAT = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 5,
    maximumFractionDigits: 5,
});

// Elementos del DOM
let progressBar: HTMLDivElement | null = null;
let percent: HTMLSpanElement | null = null;
let memoryUsage: HTMLSpanElement | null = null;
let coordinates: HTMLDivElement | null = null;
let crsButton: HTMLButtonElement | null = null;

let isCameraMoving = false;
let currentInstance: Instance | null = null;
const additionalInstances: Instance[] = [];
let pickingRadius: number | undefined;
const tmpVec3 = new Vector3();
const lastCameraPosition = new Vector3(0, 0, 0);

let pickedPoint: { x: number; y: number; z: number } | null = null;
let coordsAsLatLon = false;
let ecefToLatlonConverter: Converter;

function processUrl(instance: Instance, url: string) {
    const pov = new URL(url).searchParams.get(VIEW_PARAM);
    if (pov) {
        try {
            const [x, y, z, tx, ty, tz] = pov.split(',').map(s => Number.parseFloat(s));
            instance.view.camera.position.set(x, y, z);
            instance.view.controls?.target?.set(tx, ty, tz);
        } finally {
            instance.notifyChange();
        }
    }
}

function updateUrl() {
    if (!currentInstance) return;

    const url = new URL(document.URL);
    url.searchParams.delete(VIEW_PARAM);

    const round10 = (n: number) => Math.round(n * 10) / 10;

    const cam = currentInstance.view.camera.position;
    const target = currentInstance.view.controls?.target;


    if (target) {
        const pov = `${round10(cam.x)},${round10(cam.y)},${round10(cam.z)},${round10(target.x)},${round10(target.y)},${round10(target.z)}`;
        if (pov === currentURL) return;

        currentURL = pov;
        url.searchParams.append(VIEW_PARAM, pov);

        window.history.replaceState({}, '', url.toString());
    }
}

function updateCameraMoving() {
    if (!currentInstance) return;

    const cameraPosition = currentInstance.view.camera.getWorldPosition(tmpVec3);

    if (lastCameraPosition.distanceToSquared(cameraPosition) < 3) {
        isCameraMoving = false;
    } else {
        lastCameraPosition.copy(cameraPosition);
        isCameraMoving = true;
    }
}

function updateProgressFrameRequester() {
    if (!currentInstance || !progressBar || !percent || !memoryUsage) return;

    progressBar.style.width = `${currentInstance.progress * 100}%`;
    percent.innerText = `${Math.round(currentInstance.progress * 100)}%`;

    const mem = currentInstance.getMemoryUsage();

    for (const instance of additionalInstances) {
        const otherMem = instance.getMemoryUsage();
        mem.cpuMemory += otherMem.cpuMemory;
        mem.gpuMemory += otherMem.gpuMemory;
    }

    const memoryUsageString = `Mem ${MemoryUsage.format(mem.cpuMemory)} (CPU), ${MemoryUsage.format(mem.gpuMemory)} (GPU)`;
    const threshold = 512 * 1024 * 1024;

    if (mem.cpuMemory > threshold || mem.gpuMemory > threshold) {
        memoryUsage.classList.add('text-danger', 'fw-bold');
    } else {
        memoryUsage.classList.remove('text-danger', 'fw-bold');
    }

    memoryUsage.innerText = memoryUsageString;
}

function updateCoordinates() {
    if (!currentInstance || !coordinates || !crsButton) return;

    const coords = pickedPoint;
    const crs = currentInstance.referenceCrs

    crsButton.innerText = coordsAsLatLon ? 'lat/lon' : crs;

    if (coords) {
        coordinates.classList.remove('d-none');

        const { x, y, z } = coords;

        if (coordsAsLatLon && Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
            const [lon, lat, alt] = ecefToLatlonConverter.forward([x, y, z]);
            coordinates.textContent = `lat: ${LATLON_FORMAT.format(lat)}, lon: ${LATLON_FORMAT.format(lon)}, altitude: ${NUMBER_FORMAT.format(alt)}`;
        } else {
            coordinates.textContent = coordsAsLatLon
                ? `lat: NaN, lon: NaN, altitude: NaN`
                : `x: ${NUMBER_FORMAT.format(x)}, y: ${NUMBER_FORMAT.format(y)}, z: ${NUMBER_FORMAT.format(z)}`;
        }
    } else {
        coordinates.classList.add('d-none');
    }
}

function pick(mouseEvent: MouseEvent) {
    updateCameraMoving();

    if (!isCameraMoving && currentInstance) {
        const picked = currentInstance.pickObjectsAt(mouseEvent, {
            limit: 1,
            radius: pickingRadius,
            sortByDistance: true,
        });

        pickedPoint = picked[0]?.point ?? null;
        updateCoordinates();
    }
}

interface BindOptions {
    radius?: number;
    disableUrlUpdate?: boolean;
    disableCoordinates?: boolean;
    additionalInstances?: Instance | Instance[];
}

function setAttributionHtml(html: string) {
    const el = document.getElementById('attributions');
    if (el) el.innerHTML = html;
}

function bind(instance: Instance, options: BindOptions = {}) {
    pickingRadius = options.radius;
    currentInstance = instance;

    if (!options.disableCoordinates) {
        coordinates = document.getElementById('coordinates') as HTMLDivElement | null;
        instance.domElement.addEventListener('mousemove', pick);
    }

    ecefToLatlonConverter = proj4(instance.referenceCrs, 'EPSG:4979');

    progressBar = document.getElementById('progress-bar') as HTMLDivElement | null;
    percent = document.getElementById('loading-percent') as HTMLSpanElement | null;
    memoryUsage = document.getElementById('memory-usage') as HTMLSpanElement | null;
    crsButton = document.getElementById('crs') as HTMLButtonElement | null;

    if (crsButton) {
        crsButton.onclick = () => {
            coordsAsLatLon = !coordsAsLatLon;
            updateCoordinates();
        };
    }

    if (options.additionalInstances) {
        if (Array.isArray(options.additionalInstances)) {
            additionalInstances.push(...options.additionalInstances);
        } else {
            additionalInstances.push(options.additionalInstances);
        }
    }

    instance.addEventListener('update-end', updateProgressFrameRequester);

    if (!options.disableUrlUpdate) {
        setInterval(updateUrl, 200);
        processUrl(instance, document.URL);
    }
}

export default { bind, setAttributionHtml };
