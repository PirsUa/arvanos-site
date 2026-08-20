(() => {
  const isEnglish = document.documentElement.lang === 'en';
  const assetPrefix = isEnglish ? './assets/' : '../assets/';
  const asset = (path) => `${assetPrefix}${path}`;
  const menuCopy = isEnglish
    ? { open: 'Open navigation', close: 'Close navigation', menu: 'Menu', closeText: 'Close' }
    : { open: 'Відкрити навігацію', close: 'Закрити навігацію', menu: 'Меню', closeText: 'Закрити' };
  const video = document.querySelector('#field-video');
  const fieldObject = document.querySelector('#field-object');
  const outline = document.querySelector('#field-outline');
  const mapGrid = document.querySelector('#field-map-grid');
  const mapBase = document.querySelector('#field-map-base');
  const mapZones = document.querySelector('#field-map-zones');
  const mapDetail = document.querySelector('#field-map-detail');
  const fieldLayerImages = [...document.querySelectorAll('.field-layer-image')];
  const methodOverlayImages = [...document.querySelectorAll('.method-overlay-image')];
  const vegetationAnomalyImage = document.querySelector('.vegetation-anomaly-image');
  const vegetationTargetsLayer = document.querySelector('.vegetation-targets-layer');
  const herusTargetsLayer = document.querySelector('.herus-targets-layer');
  const labControlTargetsLayer = document.querySelector('.lab-control-targets-layer');
  const samplingGridImages = [...document.querySelectorAll('.sampling-grid-image')];
  const mapStatus = document.querySelector('.map-status');
  const mapLayerChips = [...document.querySelectorAll('[data-map-layer-chip]')];
  const detailStepper = document.querySelector('#detail-stepper');
  const detailStepButtons = [...document.querySelectorAll('.detail-step-button[data-detail-level]')];
  const samplingSampleCount = document.querySelector('#sampling-sample-count');
  const samplingSampleUnit = document.querySelector('#sampling-sample-unit');
  const sceneNote = document.querySelector('#scene-note');
  const storySteps = [...document.querySelectorAll('.story-step')];
  const storyPageButtons = [...document.querySelectorAll('.story-page-button[data-story-direction]')];
  const navigationLinks = [...document.querySelectorAll('.quick-nav a')];
  const pageLinks = [...document.querySelectorAll('a[href^="#"]:not(.skip-link)')];
  const menuButton = document.querySelector('.menu-button');
  const quickNav = document.querySelector('.quick-nav');
  let keyframes;
  let state = 'dormant';
  let sequenceStart = 0;
  let morphStart = 0;
  let morphFrom = null;
  let mapPoints = null;
  let latestTrackedPoints = null;
  let refinementLevel = 0;
  let activeStoryIndex = -1;
  let pageTurnLocked = false;
  let touchStartY = 0;
  let selectedMapLayer = '';
  let currentTextureImage = 0;
  let currentTextureSource = '';
  let currentGridImage = 0;
  let currentGridSource = '';
  let layerDetailLevel = 3;
  let samplingDetailLevel = 3;
  let activeDetailContext = '';
  let costComparisonTimer = 0;
  const BLINK_CYCLE = 260;
  const BLINK_DURATION = BLINK_CYCLE * 3;
  const LIFT_DURATION = 280;
  const MOVE_DURATION = 1500;
  const TEXTURE_SIZE = 1024;
  const TEXTURE_PADDING = 94;
  const MAP_LAYERS = {
    ph: asset('field-map-layers/exact/ph.png'),
    nutrition: asset('field-map-layers/exact/nutrition.png'),
    organic: asset('field-map-layers/exact/organic.png'),
    moisture: asset('field-map-layers/exact/moisture.png'),
    compaction: asset('field-map-layers/exact/compaction.png'),
    vegetation: asset('field-map-layers/exact/vegetation.png'),
  };
  const METHOD_LAYER_CAPABILITIES = {
    hyperspectral: new Set(['moisture', 'nutrition', 'organic', 'ph', 'vegetation']),
    maya: new Set(['moisture', 'nutrition', 'organic', 'ph', 'compaction', 'vegetation']),
    indirect: new Set(['moisture', 'nutrition', 'organic', 'ph', 'compaction']),
    vegetation: new Set(['vegetation']),
  };
  const HERUS_TARGETS = [
    // Об’єднаний набір після відбору в 4 стійких діапазонах і на 3 переходах
    // кожного шару. Зовнішній контур виключено, але крайові зони поля
    // залишено в завданні; близькі міжшарові кандидати зведені в одну точку.
    [333,424],[833,361],[880,341],[709,528],[191,698],
    [129,680],[253,640],[368,530],[201,506],[796,406],
    [400,419],[176,551],[573,414],[368,716],[667,437],
    [164,609],[620,603],[675,561],[471,712],[250,536],
    [285,493],[254,444],[745,408],[745,495],[323,554],
    [326,696],[543,493],[572,626],[485,504],
  ];
  const SAMPLING_LEVELS = [
    {
      title: isEnglish ? 'Baseline detail' : 'Базова деталізація',
      samples: 0,
      textureStage: 2,
      grid: '',
    },
    {
      title: isEnglish ? 'Standard accuracy' : 'Звичайна точність',
      samples: 14,
      textureStage: 3,
      grid: asset('field-map-layers/sampling-grids/grid-standard.png'),
    },
    {
      title: isEnglish ? 'Detailed grid' : 'Детальна сітка',
      samples: 26,
      textureStage: 4,
      grid: asset('field-map-layers/sampling-grids/grid-detailed.png'),
    },
    {
      title: isEnglish ? 'High accuracy' : 'Висока точність',
      samples: 48,
      textureStage: 0,
      grid: asset('field-map-layers/sampling-grids/grid-high.png'),
    },
  ];

  // Точна локальна копія assets/field-contour-keyframes.json. Вона потрібна лише тоді,
  // коли браузер блокує fetch() через відкриття демонстрації з file://.
  const localContourFallback = {
    keyframes: [
      { id: 'start', time: 0, points: [[1061.48,237.35],[1056.92,233.93],[1047.81,233.93],[1016.23,245.02],[971.83,254.98],[950.2,262.09],[900.1,272.33],[762.3,272.32],[754.04,275.16],[698.21,323.56],[689.67,326.69],[675.71,339.78],[651.77,358.01],[643.79,368.83],[634.66,389.91],[637.79,396.46],[643.77,403.01],[670.55,403.01],[682.51,409],[698.75,409],[717.55,412.7],[757.15,412.7],[779.37,409.28],[803.58,403.02],[820.1,396.18],[978.12,307.06],[1045.27,262.38],[1057.22,251.86],[1061.48,245.6]] },
      { id: 'mid_2_6', time: 2.6, points: [[1048.89,239.21],[1032.9,234.65],[1013.75,241.27],[994.41,247.26],[974.76,252.21],[955.11,257.08],[935.53,262.25],[915.75,265.83],[896.09,269.97],[876.31,271.43],[856.23,270.94],[836.09,271.26],[815.94,272.11],[795.87,272.1],[775.76,272.12],[755.85,272.8],[738.18,280.68],[722.29,292.71],[706.77,305.34],[691.32,318.24],[675.86,331.11],[660.85,344.55],[646.15,358.32],[633.61,373.74],[627.83,391.99],[642.27,403.57],[662.36,406.05],[682.4,408.56],[702.4,410.59],[722.34,412.32],[742.43,412.95],[762.55,412.37],[782.25,408.86],[800.87,401.57],[817.76,391.37],[834.15,381.24],[850.96,371.55],[868.55,361.94],[885.79,352.36],[903.13,342.85],[920.65,333.43],[937.86,323.47],[955.22,313.43],[972.5,303.09],[989.27,291.8],[1006.01,280.44],[1022.65,268.92],[1037.75,255.5]] },
      { id: 'mid_5_2', time: 5.2, points: [[1001.1,240.22],[985.01,235.26],[966.46,241.98],[947.84,248.47],[928.69,253.16],[909.8,258.86],[890.79,263.99],[871.52,267.9],[852.37,271.54],[832.92,272.06],[813.32,272.15],[793.6,272.18],[773.99,272.94],[754.56,273.43],[735.04,273.91],[715.39,274.08],[697.55,280.55],[682.68,293.04],[668.71,306.72],[654.48,320.2],[640.52,333.99],[626.4,347.64],[612.31,361.39],[600.82,376.98],[596.9,395.73],[611.22,407.27],[630.82,409.09],[650.32,411.15],[669.83,413.09],[689.44,413.92],[708.84,415.2],[728.39,416.01],[747.79,413.99],[766.04,407.57],[781.91,396.5],[797.88,386.82],[814.55,377.36],[831.12,367.23],[847.6,357.13],[864.08,347.15],[880.92,337.44],[897.34,327.27],[914.28,317.31],[930.6,306.37],[946.53,294.8],[962.37,283.06],[977.88,270.88],[991.69,256.85]] },
      { id: 'mid_7_8', time: 7.8, points: [[929.88,245.87],[918.57,233.49],[900.35,238.34],[882.6,245.25],[864.5,251.22],[846.2,256.58],[828.16,262.69],[809.73,267.32],[791.36,271.69],[772.59,272.43],[753.65,272.49],[734.65,272.74],[715.77,274.12],[696.9,274.15],[678.16,274.86],[659.19,275.31],[640.49,276.5],[625.66,287.91],[612.89,301.9],[600.69,316.35],[587.88,330.26],[575.91,344.93],[563.51,359.31],[553.32,375.17],[548.32,393.48],[558.01,409.05],[576.51,412.03],[595.42,414.01],[614.31,415.46],[633.19,416.63],[652.12,417.73],[670.97,418.79],[689.82,419.7],[708.28,416.39],[725.53,409.03],[741.28,399.42],[756.84,388.93],[772.43,378.19],[787.77,367.36],[803.21,356.78],[818.67,346.24],[834.16,335.7],[849.52,324.7],[864.75,313.37],[879.72,301.65],[894.02,289.08],[907.97,276.12],[921.29,262.56]] },
      { id: 'end', time: 10.4, points: [[564,280],[602,277],[648,276],[681,275],[728,274],[749,267],[774,258],[796,251],[815,246],[831,237],[845,235],[857,242],[857,254],[852,267],[837,286],[823,302],[807,320],[785,338],[766,355],[753,365],[727,382],[707,398],[690,412],[677,422],[661,426],[619,425],[571,425],[533,421],[511,420],[498,411],[497,398],[497,383],[506,369],[520,347],[536,322],[554,296]] },
    ],
  };

  const clamp = (number, min = 0, max = 1) => Math.min(max, Math.max(min, number));
  const mix = (a, b, progress) => a + (b - a) * progress;
  const ease = (progress) => 1 - Math.pow(1 - clamp(progress), 3);
  const pathFrom = (points) => points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ') + 'Z';

  function setPaths(points) {
    const path = pathFrom(points);
    outline.setAttribute('d', path);
    mapGrid.setAttribute('d', path);
    mapBase.setAttribute('d', path);
    mapZones.setAttribute('d', path);
    mapDetail.setAttribute('d', path);
  }

  function transformPoints(points, matrix) {
    if (!matrix) return points.map((point) => [...point]);
    const [a, b, c, d, x, y] = matrix;
    return points.map(([pointX, pointY]) => [
      a * pointX + c * pointY + x,
      b * pointX + d * pointY + y,
    ]);
  }

  function targetMapPoints() {
    const reconstructed = window.ARVANOS_FIELD_PLAN?.points;
    const canonical = reconstructed
      ? resampleClosed(reconstructed, keyframes[0].points.length)
      : keyframes[0].points;
    const xs = canonical.map((point) => point[0]);
    const ys = canonical.map((point) => point[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const viewportScale = Math.max(innerWidth / 1920, innerHeight / 1080);
    const visibleWidth = innerWidth / viewportScale;
    const visibleHeight = innerHeight / viewportScale;
    const visibleX = (1920 - visibleWidth) / 2;
    const visibleY = (1080 - visibleHeight) / 2;
    const minimumMapWidth = innerWidth <= 560 ? 220 : innerWidth <= 920 ? 280 : innerWidth <= 1200 ? 300 : 440;
    const maximumMapWidth = innerWidth <= 560 ? innerWidth - 48 : innerWidth <= 920 ? innerWidth * .42 : innerWidth <= 1200 ? 340 : 740;
    const screenWidth = Math.min(maximumMapWidth, Math.max(minimumMapWidth, innerWidth * .37));
    const width = screenWidth / viewportScale;
    const height = width * (maxY - minY) / (maxX - minX);
    const angle = -33 * Math.PI / 180;
    const cosine = Math.cos(angle), sine = Math.sin(angle);
    let points = canonical.map(([x, y]) => {
      const localX = ((x - minX) / (maxX - minX) - .5) * width;
      const localY = ((y - minY) / (maxY - minY) - .5) * height;
      return [
        localX * cosine - localY * sine,
        localX * sine + localY * cosine,
      ];
    });
    const targetMinX = Math.min(...points.map((point) => point[0]));
    const targetMaxY = Math.max(...points.map((point) => point[1]));
    const marginPixels = innerWidth <= 560 ? 24 : Math.max(42, innerWidth * .04);
    const margin = marginPixels / viewportScale;
    const statusReserve = (innerWidth <= 560 ? 320 : innerWidth <= 920 ? 170 : 190) / viewportScale;
    const shiftX = visibleX + margin - targetMinX;
    const shiftY = visibleY + visibleHeight - margin - statusReserve - targetMaxY;
    points = points.map(([x, y]) => [x + shiftX, y + shiftY]);

    const spanX = maxX - minX;
    const spanY = maxY - minY;
    const sourceScale = Math.min(
      (TEXTURE_SIZE - TEXTURE_PADDING) / spanX,
      (TEXTURE_SIZE - TEXTURE_PADDING) / spanY,
    );
    const sourceOffsetX = (TEXTURE_SIZE - spanX * sourceScale) / 2 - minX * sourceScale;
    const sourceOffsetY = (TEXTURE_SIZE - spanY * sourceScale) / 2 - minY * sourceScale;
    const targetScale = width / spanX;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const targetA = cosine * targetScale;
    const targetB = sine * targetScale;
    const targetC = -sine * targetScale;
    const targetD = cosine * targetScale;
    const targetE = shiftX - targetA * centerX - targetC * centerY;
    const targetF = shiftY - targetB * centerX - targetD * centerY;
    const imageA = targetA / sourceScale;
    const imageB = targetB / sourceScale;
    const imageC = targetC / sourceScale;
    const imageD = targetD / sourceScale;
    const imageE = targetE - imageA * sourceOffsetX - imageC * sourceOffsetY;
    const imageF = targetF - imageB * sourceOffsetX - imageD * sourceOffsetY;
    const imageTransform = `matrix(${imageA} ${imageB} ${imageC} ${imageD} ${imageE} ${imageF})`;
    [...fieldLayerImages, ...methodOverlayImages, vegetationAnomalyImage, vegetationTargetsLayer, herusTargetsLayer, labControlTargetsLayer, ...samplingGridImages]
      .filter(Boolean)
      .forEach((image) => image.setAttribute('transform', imageTransform));
    return points;
  }

  function applyStabilization(time) {
    const stabilization = window.ARVANOS_VIDEO_STABILIZATION;
    const segments = stabilization?.segments || (stabilization ? [stabilization] : []);
    let effectiveTime = time;
    let segment = segments.find((candidate) => time >= candidate.start && time <= candidate.end);
    if (!segment) {
      segment = segments.find((candidate) => {
        if (!candidate.wrapAt || time > candidate.end - candidate.wrapAt) return false;
        effectiveTime = time + candidate.wrapAt;
        return effectiveTime >= candidate.start && effectiveTime <= candidate.end;
      });
    }
    if (!segment) {
      video.style.transform = 'none';
      return null;
    }
    const position = (effectiveTime - segment.start) * segment.fps;
    const fromIndex = Math.min(Math.floor(position), segment.matrices.length - 1);
    const toIndex = Math.min(fromIndex + 1, segment.matrices.length - 1);
    const progress = position - fromIndex;
    const matrix = segment.matrices[fromIndex].map((value, index) => (
      mix(value, segment.matrices[toIndex][index], progress)
    ));
    const [a, b, c, d, sourceX, sourceY] = matrix;
    const width = video.clientWidth;
    const height = video.clientHeight;
    const sourceWidth = video.videoWidth || 1920;
    const sourceHeight = video.videoHeight || 1080;
    const coverScale = Math.max(width / sourceWidth, height / sourceHeight);
    const offsetX = (width - sourceWidth * coverScale) / 2;
    const offsetY = (height - sourceHeight * coverScale) / 2;
    const translateX = coverScale * sourceX + offsetX - a * offsetX - c * offsetY;
    const translateY = coverScale * sourceY + offsetY - b * offsetX - d * offsetY;
    const cssMatrix = `matrix(${a},${b},${c},${d},${translateX},${translateY})`;
    video.style.transform = cssMatrix;
    return { cssMatrix, sourceMatrix: matrix };
  }

  function resampleClosed(points, count) {
    if (points.length === count) return points;
    const lengths = points.map((point, index) => Math.hypot(
      points[(index + 1) % points.length][0] - point[0],
      points[(index + 1) % points.length][1] - point[1],
    ));
    const perimeter = lengths.reduce((total, length) => total + length, 0);
    let edge = 0, consumed = 0;
    return Array.from({ length: count }, (_, index) => {
      const distance = perimeter * index / count;
      while (edge < lengths.length - 1 && consumed + lengths[edge] < distance) {
        consumed += lengths[edge++];
      }
      const progress = (distance - consumed) / lengths[edge];
      const from = points[edge], to = points[(edge + 1) % points.length];
      return [mix(from[0], to[0], progress), mix(from[1], to[1], progress)];
    });
  }

  function normalizeContour(points) {
    let normalized = points.map((point) => [...point]);
    const area = normalized.reduce((sum, point, index) => {
      const next = normalized[(index + 1) % normalized.length];
      return sum + point[0] * next[1] - next[0] * point[1];
    }, 0);
    if (area > 0) normalized.reverse();
    const anchor = normalized.reduce((best, point, index) => (
      point[0] - point[1] * .04 > normalized[best][0] - normalized[best][1] * .04 ? index : best
    ), 0);
    return [...normalized.slice(anchor), ...normalized.slice(0, anchor)];
  }

  function trackingProgress(time) {
    const endTime = keyframes[keyframes.length - 1].time;
    if (time <= endTime) return time;
    const returnDuration = Math.max(.01, (video.duration || endTime * 2) - endTime);
    return endTime - clamp((time - endTime) / returnDuration) * endTime;
  }

  function applyRefinementClasses() {
    fieldObject.classList.remove('refine-1', 'refine-2', 'refine-3', 'refine-4');
    if (refinementLevel) fieldObject.classList.add(`refine-${refinementLevel}`);
  }

  function setTextureSource(source, immediate = false) {
    if (!source || currentTextureSource === source) return;
    const previousTextureImage = currentTextureImage;
    const nextTextureImage = currentTextureSource && !immediate ? 1 - previousTextureImage : previousTextureImage;
    const nextImage = fieldLayerImages[nextTextureImage];
    nextImage.setAttribute('href', source);
    requestAnimationFrame(() => {
      fieldLayerImages[previousTextureImage].classList.remove('is-current');
      nextImage.classList.add('is-current');
      currentTextureImage = nextTextureImage;
    });
    currentTextureSource = source;
  }

  function setGridSource(source, immediate = false) {
    if (!source || currentGridSource === source) return;
    const previousGridImage = currentGridImage;
    const nextGridImage = currentGridSource && !immediate ? 1 - previousGridImage : previousGridImage;
    const nextImage = samplingGridImages[nextGridImage];
    nextImage.setAttribute('href', source);
    requestAnimationFrame(() => {
      samplingGridImages[previousGridImage].classList.remove('is-current');
      nextImage.classList.add('is-current');
      currentGridImage = nextGridImage;
    });
    currentGridSource = source;
  }

  function setMapLayer(layer = '', immediate = false, updateTexture = true) {
    if (!MAP_LAYERS[layer]) return;
    selectedMapLayer = layer;
    if (updateTexture) setTextureSource(MAP_LAYERS[layer], immediate);
    fieldObject.dataset.mapLayer = layer;
    document.body.classList.toggle('map-layer-vegetation-active', layer === 'vegetation');
    document.body.classList.toggle('map-layer-compaction-active', layer === 'compaction');
    renderHerusTargets();
    fieldObject.classList.add('has-map-layer');
    mapLayerChips.forEach((chip) => {
      const isActive = chip.dataset.mapLayerChip === layer;
      chip.classList.toggle('is-active', isActive);
      chip.setAttribute('aria-pressed', String(isActive));
    });
  }

  function renderHerusTargets() {
    if (!herusTargetsLayer || herusTargetsLayer.childElementCount) return;
    herusTargetsLayer.replaceChildren(...HERUS_TARGETS.map(([x, y], index) => {
      const target = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      target.classList.add('herus-target');
      target.style.setProperty('--target-index', index);
      target.setAttribute('transform', `translate(${x} ${y})`);
      const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      halo.classList.add('herus-target__halo');
      halo.setAttribute('r', '13');
      const core = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      core.classList.add('herus-target__core');
      core.setAttribute('r', '4.5');
      target.append(halo, core);
      return target;
    }));
  }

  function applyMethodLayerAvailability(methodDemo = '') {
    const availableLayers = METHOD_LAYER_CAPABILITIES[methodDemo] || null;
    mapLayerChips.forEach((chip) => {
      const unavailable = Boolean(availableLayers && !availableLayers.has(chip.dataset.mapLayerChip));
      chip.disabled = unavailable;
      chip.setAttribute('aria-disabled', String(unavailable));
      chip.title = unavailable
        ? (methodDemo === 'hyperspectral' || methodDemo === 'maya') && chip.dataset.mapLayerChip === 'compaction'
          ? isEnglish ? 'Hyperspectral imaging does not measure soil compaction' : 'Гіперспектральна зйомка не вимірює ущільнення ґрунту'
          : methodDemo === 'vegetation'
            ? isEnglish ? 'This scene shows crop condition only' : 'На цій сцені показано лише стан рослин'
          : isEnglish ? 'This method cannot produce this layer on its own' : 'Цей метод самостійно не формує такий шар'
        : '';
    });
    const accuracyLocked = methodDemo === 'vegetation';
    detailStepButtons.forEach((button) => {
      button.disabled = accuracyLocked;
      button.setAttribute('aria-disabled', String(accuracyLocked));
    });
    if (availableLayers && !availableLayers.has(selectedMapLayer || 'moisture')) {
      setMapLayer([...availableLayers][0], false, false);
    }
  }

  function applyDetailLevel(rawLevel, showSamplingGrid = false, immediate = false) {
    const levelIndex = clamp(Math.round(Number(rawLevel)), 0, SAMPLING_LEVELS.length - 1);
    const layer = selectedMapLayer || 'moisture';
    const isHerusMeasurementDemo = document.body.classList.contains('herus-measurement-mode');
    const isCostComparisonIntro = document.body.classList.contains('cost-comparison-intro');
    const level = SAMPLING_LEVELS[levelIndex];
    const isInitialMapDemo = document.body.classList.contains('initial-map-mode');
    const methodDemo = document.body.classList.contains('method-hyperspectral-active')
      ? 'hyperspectral'
      : document.body.classList.contains('method-maya-active')
        ? 'maya'
      : document.body.classList.contains('method-indirect-active')
        ? 'indirect'
        : '';
    const textureStage = isCostComparisonIntro
      ? 4
      : isHerusMeasurementDemo && levelIndex === 3
      ? layer === 'compaction' ? 0 : 4
      : isInitialMapDemo
      ? layer === 'vegetation'
        ? SAMPLING_LEVELS[Math.min(levelIndex, 2)].textureStage
        : SAMPLING_LEVELS[Math.min(levelIndex, 1)].textureStage
      : methodDemo === 'maya' && layer === 'compaction'
        ? SAMPLING_LEVELS[Math.min(levelIndex, 1)].textureStage
      : methodDemo && !level.textureStage
        ? 4
        : level.textureStage;
    const texture = textureStage
      ? asset(`field-map-layers/intermediate/${layer}-stage-${textureStage}.png`)
      : MAP_LAYERS[layer];
    setTextureSource(texture, immediate);
    if (showSamplingGrid && level.grid) {
      setGridSource(level.grid, immediate);
      fieldObject.classList.add('sampling-grid-active');
    } else {
      fieldObject.classList.remove('sampling-grid-active');
    }
    detailStepper.style.setProperty('--detail-progress', `${levelIndex * 100 / (SAMPLING_LEVELS.length - 1)}%`);
    detailStepButtons.forEach((button) => {
      const buttonLevel = Number(button.dataset.detailLevel);
      button.classList.toggle('is-active', buttonLevel === levelIndex);
      button.classList.toggle('is-reached', buttonLevel <= levelIndex);
      button.setAttribute('aria-pressed', String(buttonLevel === levelIndex));
    });
    detailStepper.setAttribute(
      'aria-label',
      showSamplingGrid
        ? isEnglish
          ? `Map accuracy: ${level.title}, ${level.samples ? `${level.samples} laboratory samples` : 'no sampling grid'}`
          : `Точність карти: ${level.title}, ${level.samples ? `${level.samples} лабораторних проб` : 'без сітки проб'}`
        : isEnglish ? `Map accuracy: ${level.title}` : `Точність карти: ${level.title}`,
    );
    samplingSampleCount.textContent = level.samples ? String(level.samples) : '';
    samplingSampleUnit.textContent = level.samples
      ? isEnglish ? ' laboratory samples' : ' лабораторних проб'
      : isEnglish ? 'No sampling grid' : 'Без сітки проб';
  }

  function render(now) {
    const stabilization = applyStabilization(video.currentTime);
    if (keyframes) {
      const time = trackingProgress(video.currentTime);
      const nextIndex = keyframes.findIndex((frame) => frame.time >= time);
      const toIndex = nextIndex === -1 ? keyframes.length - 1 : nextIndex;
      const fromIndex = Math.max(0, toIndex - 1);
      const from = keyframes[fromIndex], to = keyframes[toIndex];
      const progress = from === to ? 0 : clamp((time - from.time) / (to.time - from.time));
      latestTrackedPoints = from.points.map(([x, y], index) => [
        mix(x, to.points[index][0], progress),
        mix(y, to.points[index][1], progress),
      ]);

      if (state === 'dormant') {
        document.body.classList.remove('map-ready');
        fieldObject.style.transform = stabilization?.cssMatrix || 'none';
        fieldObject.style.opacity = '0';
        fieldObject.classList.remove('is-active', 'is-lifted', 'is-map', 'is-textured', 'refine-1', 'refine-2', 'refine-3', 'refine-4');
        mapGrid.style.opacity = '';
        mapStatus.classList.remove('is-visible');
        setPaths(latestTrackedPoints);
      } else if (state === 'blinking') {
        document.body.classList.remove('map-ready');
        const elapsed = now - sequenceStart;
        fieldObject.style.transform = stabilization?.cssMatrix || 'none';
        fieldObject.classList.add('is-active');
        fieldObject.classList.remove('is-lifted', 'is-map', 'is-textured');
        setPaths(latestTrackedPoints);
        if (elapsed < BLINK_DURATION) {
          const phase = (elapsed % BLINK_CYCLE) / BLINK_CYCLE;
          const opacity = phase < .5 ? mix(1, .12, phase * 2) : mix(.12, 1, (phase - .5) * 2);
          fieldObject.style.opacity = opacity.toFixed(3);
        } else {
          morphFrom = transformPoints(latestTrackedPoints, stabilization?.sourceMatrix);
          mapPoints = targetMapPoints();
          morphStart = now;
          state = 'morphing';
          fieldObject.style.transform = 'none';
          fieldObject.style.opacity = '1';
          fieldObject.classList.add('is-lifted');
          setPaths(morphFrom);
        }
      } else if (state === 'morphing') {
        fieldObject.style.transform = 'none';
        fieldObject.style.opacity = '1';
        fieldObject.classList.add('is-active', 'is-lifted');
        const movement = clamp((now - morphStart - LIFT_DURATION) / MOVE_DURATION);
        document.body.classList.toggle('map-ready', movement > .78);
        const progress = ease(movement);
        const points = morphFrom.map(([x, y], index) => [
          mix(x, mapPoints[index][0], progress),
          mix(y, mapPoints[index][1], progress),
        ]);
        fieldObject.classList.toggle('is-map', movement > .62);
        mapGrid.style.opacity = clamp((movement - .68) / .32 * .34).toFixed(3);
        setPaths(points);
        if (movement >= 1) {
          state = 'map';
          fieldObject.classList.add('is-map', 'is-textured');
          mapGrid.style.opacity = '';
          applyRefinementClasses();
          mapStatus.classList.add('is-visible');
        }
      } else {
        document.body.classList.add('map-ready');
        fieldObject.style.transform = 'none';
        fieldObject.style.opacity = '1';
        fieldObject.classList.add('is-active', 'is-lifted', 'is-map', 'is-textured');
        applyRefinementClasses();
        mapGrid.style.opacity = '';
        mapStatus.classList.add('is-visible');
        setPaths(mapPoints);
      }
    }
    requestAnimationFrame(render);
  }

  function triggerTransition() {
    if (state !== 'dormant') return;
    state = 'blinking';
    sequenceStart = performance.now();
    fieldObject.classList.add('is-active');
    fieldObject.style.opacity = '1';
  }

  function resetTransition() {
    state = 'dormant';
    morphFrom = null;
    mapPoints = null;
    refinementLevel = 0;
    fieldObject.classList.remove('is-active', 'is-lifted', 'is-map', 'is-textured', 'refine-1', 'refine-2', 'refine-3', 'refine-4');
    fieldObject.style.opacity = '0';
    mapGrid.style.opacity = '';
    mapStatus.classList.remove('is-visible');
    document.body.classList.remove('map-ready');
  }

  function updateStoryState() {
    const focus = scrollY + innerHeight * .48;
    let activeIndex = 0;
    let closestDistance = Infinity;
    storySteps.forEach((step, index) => {
      const center = step.offsetTop + step.offsetHeight / 2;
      const distance = Math.abs(center - focus);
      if (distance < closestDistance) {
        closestDistance = distance;
        activeIndex = index;
      }
    });

    storySteps.forEach((step, index) => step.classList.toggle('is-active', index === activeIndex));
    const activeStep = storySteps[activeIndex];
    const isSamplingDemo = activeStep.dataset.samplingDemo === 'true';
    const isVegetationDemo = activeStep.dataset.vegetationDemo === 'true';
    const isInitialMapDemo = activeStep.dataset.initialMapDemo === 'true';
    const isHerusTargetsDemo = activeStep.dataset.herusTargetsDemo === 'true';
    const isHerusMeasurementDemo = activeStep.dataset.herusMeasurementDemo === 'true';
    const isLabControlDemo = activeStep.dataset.labControlDemo === 'true';
    const isCleanMapDemo = activeStep.dataset.cleanMapDemo === 'true';
    const isCostComparisonDemo = activeStep.dataset.costComparisonDemo === 'true';
    const isAiCoreDemo = activeStep.dataset.aiCoreDemo === 'true';
    const isFutureActionDemo = activeStep.dataset.futureActionDemo === 'true';
    const sceneNoteContent = [
      ['scene-note__title', activeStep.dataset.noteTitle],
      ['scene-note__body', activeStep.dataset.noteBody],
      ['scene-note__detail', activeStep.dataset.noteDetail],
    ].filter(([, text]) => Boolean(text));
    const shouldResetMap = activeStep.dataset.mapReset === 'true';
    const methodDemo = activeStep.dataset.methodDemo || '';
    const transitionStep = storySteps.find((step) => step.dataset.scene === 'transition');
    const transitionIndex = storySteps.indexOf(transitionStep);
    const aiCoreStep = storySteps.find((step) => step.dataset.aiCoreDemo === 'true');
    const aiCoreIndex = storySteps.indexOf(aiCoreStep);
    const mapIsAvailable = activeIndex >= transitionIndex && activeIndex <= aiCoreIndex;
    if (activeIndex !== activeStoryIndex && mapIsAvailable) {
      if (isSamplingDemo) samplingDetailLevel = 3;
      else layerDetailLevel = clamp(Number(activeStep.dataset.sceneDetailLevel || 3), 0, SAMPLING_LEVELS.length - 1);
    }
    const nextDetailContext = isSamplingDemo ? 'sampling' : isVegetationDemo ? 'vegetation' : mapIsAvailable ? 'layers' : '';
    if (nextDetailContext !== activeDetailContext) {
      activeDetailContext = nextDetailContext;
    }
    document.body.classList.toggle('section-intro-active', activeStep.classList.contains('story-step--section-intro'));
    document.body.classList.toggle('detail-mode', mapIsAvailable);
    document.body.classList.toggle('sampling-mode', isSamplingDemo);
    document.body.classList.toggle('vegetation-mode', isVegetationDemo);
    document.body.classList.toggle('initial-map-mode', isInitialMapDemo);
    document.body.classList.toggle('herus-targets-mode', isHerusTargetsDemo);
    document.body.classList.toggle('herus-measurement-mode', isHerusMeasurementDemo);
    document.body.classList.toggle('lab-control-mode', isLabControlDemo);
    document.body.classList.toggle('clean-map-mode', isCleanMapDemo);
    document.body.classList.toggle('cost-comparison-mode', isCostComparisonDemo);
    document.body.classList.toggle('ai-core-mode', isAiCoreDemo);
    document.body.classList.toggle('future-action-mode', isFutureActionDemo);
    document.body.classList.toggle('scene-note-mode', sceneNoteContent.length > 0);
    if (activeIndex !== activeStoryIndex) {
      sceneNote.replaceChildren(...sceneNoteContent.map(([className, text]) => {
        const paragraph = document.createElement('p');
        paragraph.className = className;
        paragraph.textContent = text;
        return paragraph;
      }));
      clearInterval(costComparisonTimer);
      document.body.classList.toggle('cost-comparison-intro', isCostComparisonDemo);
      if (isCostComparisonDemo) {
        setGridSource(SAMPLING_LEVELS[2].grid, true);
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
          document.body.classList.remove('cost-comparison-intro');
        } else {
          costComparisonTimer = setInterval(() => {
            if (!document.body.classList.contains('cost-comparison-mode')) return;
            document.body.classList.toggle('cost-comparison-intro');
            applyDetailLevel(layerDetailLevel, false, true);
          }, 3000);
        }
      }
    }
    document.body.classList.toggle('method-demo-active', Boolean(methodDemo));
    document.body.classList.toggle('method-hyperspectral-active', methodDemo === 'hyperspectral');
    document.body.classList.toggle('method-maya-active', methodDemo === 'maya');
    document.body.classList.toggle('method-indirect-active', methodDemo === 'indirect');
    fieldObject.classList.toggle('method-hyperspectral', methodDemo === 'hyperspectral');
    fieldObject.classList.toggle('method-maya', methodDemo === 'maya');
    fieldObject.classList.toggle('method-indirect', methodDemo === 'indirect');
    applyMethodLayerAvailability(isVegetationDemo ? 'vegetation' : methodDemo);
    document.body.classList.toggle(
      'map-status-enabled',
      mapIsAvailable && !shouldResetMap && activeStep.dataset.mapStatus !== 'hidden',
    );

    if (!mapIsAvailable || shouldResetMap) {
      if (state !== 'dormant') resetTransition();
    } else {
      refinementLevel = Number(activeStep.dataset.refinement || 0);
      if (state === 'dormant') triggerTransition();
    }

    if (mapIsAvailable) {
      if (activeStep.dataset.mapLayer) setMapLayer(activeStep.dataset.mapLayer, false, false);
      applyDetailLevel(
        isVegetationDemo ? 3 : isSamplingDemo ? samplingDetailLevel : layerDetailLevel,
        isSamplingDemo,
        isCostComparisonDemo,
      );
    } else {
      fieldObject.classList.remove('sampling-grid-active');
      if (activeStep.dataset.mapLayer) setMapLayer(activeStep.dataset.mapLayer);
      else setMapLayer(selectedMapLayer || 'moisture');
    }

    const currentAnchor = [...storySteps]
      .slice(0, activeIndex + 1)
      .reverse()
      .find((step) => step.id);
    navigationLinks.forEach((link) => {
      const isCurrent = Boolean(currentAnchor && link.getAttribute('href') === `#${currentAnchor.id}`);
      link.classList.toggle('is-current', isCurrent);
      if (isCurrent) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    storyPageButtons.forEach((button) => {
      const direction = Number(button.dataset.storyDirection);
      const targetIndex = activeIndex + direction;
      const edgeUrl = direction < 0
        ? document.body.dataset.storyPreviousUrl
        : document.body.dataset.storyNextUrl;
      button.disabled = !(targetIndex >= 0 && targetIndex < storySteps.length) && !edgeUrl;
    });
    document.querySelectorAll('[data-language-switch]').forEach((link) => {
      const url = new URL(link.getAttribute('href'), location.href);
      url.searchParams.set('step', String(activeIndex));
      link.href = url.href;
    });
    activeStoryIndex = activeIndex;
  }

  function transitionToPage(targetIndex) {
    if (pageTurnLocked) return;
    targetIndex = clamp(targetIndex, 0, storySteps.length - 1);
    if (targetIndex === activeStoryIndex) return;
    const outgoingStep = storySteps[activeStoryIndex];
    const incomingStep = storySteps[targetIndex];
    pageTurnLocked = true;
    outgoingStep?.classList.add('is-leaving');
    incomingStep.classList.add('is-entering');

    setTimeout(() => {
      incomingStep.scrollIntoView({ behavior: 'auto', block: 'start' });
      updateStoryState();
      outgoingStep?.classList.remove('is-leaving');
      requestAnimationFrame(() => incomingStep.classList.remove('is-entering'));
      if (incomingStep.id) history.replaceState(null, '', `#${incomingStep.id}`);
      setTimeout(() => { pageTurnLocked = false; }, 520);
    }, 460);
  }

  function turnPage(direction) {
    if (!direction) return;
    transitionToPage(activeStoryIndex + direction);
  }

  function followStoryArrow(direction) {
    if (!direction || pageTurnLocked) return;
    const targetIndex = activeStoryIndex + direction;
    if (targetIndex >= 0 && targetIndex < storySteps.length) {
      transitionToPage(targetIndex);
      return;
    }
    const edgeUrl = direction < 0
      ? document.body.dataset.storyPreviousUrl
      : document.body.dataset.storyNextUrl;
    if (edgeUrl) location.assign(edgeUrl);
  }

  function loadContours(data) {
    if (!data.keyframes || data.keyframes.length < 2) throw new Error('Файл контуру має містити щонайменше два ключові кадри.');
    const vertexCount = Math.max(
      ...data.keyframes.map((frame) => frame.points.length),
      window.ARVANOS_FIELD_PLAN?.points?.length || 0,
    );
    keyframes = data.keyframes
      .map((frame) => ({ ...frame, points: resampleClosed(normalizeContour(frame.points), vertexCount) }))
      .sort((a, b) => a.time - b.time);
    requestAnimationFrame(render);
  }

  if (window.ARVANOS_FIELD_TRACK) {
    loadContours(window.ARVANOS_FIELD_TRACK);
  } else {
    fetch(asset('field-contour-keyframes.json'))
      .then((response) => {
        if (!response.ok) throw new Error(`Не вдалося завантажити контури (${response.status})`);
        return response.json();
      })
      .then(loadContours)
      .catch((error) => {
        console.warn('Відстеження поля Arvanos: використано локальний резервний контур.', error);
        loadContours(localContourFallback);
      });
  }

  window.addEventListener('scroll', updateStoryState, { passive: true });
  window.addEventListener('wheel', (event) => {
    if (Math.abs(event.deltaY) < 8) return;
    event.preventDefault();
    turnPage(event.deltaY > 0 ? 1 : -1);
  }, { passive: false });
  window.addEventListener('touchstart', (event) => {
    touchStartY = event.changedTouches[0]?.clientY || 0;
  }, { passive: true });
  window.addEventListener('touchend', (event) => {
    const touchEndY = event.changedTouches[0]?.clientY || touchStartY;
    const distance = touchStartY - touchEndY;
    if (Math.abs(distance) >= 36) turnPage(distance > 0 ? 1 : -1);
  }, { passive: true });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && quickNav.classList.contains('is-open')) {
      quickNav.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', menuCopy.open);
      menuButton.textContent = menuCopy.menu;
      menuButton.focus();
      return;
    }
    if (event.target instanceof HTMLElement && event.target.closest('button, a, input, textarea, select')) return;
    if (['ArrowDown', 'PageDown', ' '].includes(event.key)) {
      event.preventDefault();
      turnPage(1);
    } else if (['ArrowUp', 'PageUp'].includes(event.key)) {
      event.preventDefault();
      turnPage(-1);
    }
  });
  window.addEventListener('resize', () => {
    if (state === 'map') mapPoints = targetMapPoints();
    updateStoryState();
  });

  menuButton.addEventListener('click', () => {
    const isOpen = quickNav.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? menuCopy.close : menuCopy.open);
    menuButton.textContent = isOpen ? menuCopy.closeText : menuCopy.menu;
  });
  storyPageButtons.forEach((button) => button.addEventListener('click', () => {
    followStoryArrow(Number(button.dataset.storyDirection));
  }));
  storyPageButtons.forEach((button) => button.addEventListener('pointerup', () => {
    button.blur();
  }));
  mapLayerChips.forEach((chip, index) => {
    chip.addEventListener('click', () => {
      const isSamplingDemo = document.body.classList.contains('sampling-mode');
      setMapLayer(chip.dataset.mapLayerChip, false, false);
      applyDetailLevel(isSamplingDemo ? samplingDetailLevel : layerDetailLevel, isSamplingDemo);
    });
    chip.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let targetIndex = index;
      if (event.key === 'ArrowLeft') targetIndex = (index - 1 + mapLayerChips.length) % mapLayerChips.length;
      if (event.key === 'ArrowRight') targetIndex = (index + 1) % mapLayerChips.length;
      if (event.key === 'Home') targetIndex = 0;
      if (event.key === 'End') targetIndex = mapLayerChips.length - 1;
      mapLayerChips[targetIndex].focus();
      const isSamplingDemo = document.body.classList.contains('sampling-mode');
      setMapLayer(mapLayerChips[targetIndex].dataset.mapLayerChip, false, false);
      applyDetailLevel(isSamplingDemo ? samplingDetailLevel : layerDetailLevel, isSamplingDemo);
    });
  });
  function selectDetailLevel(level) {
    if (document.body.classList.contains('vegetation-mode')) return;
    const isSamplingDemo = document.body.classList.contains('sampling-mode');
    if (isSamplingDemo) samplingDetailLevel = level;
    else layerDetailLevel = level;
    applyDetailLevel(level, isSamplingDemo);
  }
  detailStepButtons.forEach((button, index) => {
    button.addEventListener('click', () => selectDetailLevel(Number(button.dataset.detailLevel)));
    button.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let targetIndex = index;
      if (event.key === 'ArrowLeft') targetIndex = Math.max(0, index - 1);
      if (event.key === 'ArrowRight') targetIndex = Math.min(detailStepButtons.length - 1, index + 1);
      if (event.key === 'Home') targetIndex = 0;
      if (event.key === 'End') targetIndex = detailStepButtons.length - 1;
      detailStepButtons[targetIndex].focus();
      selectDetailLevel(Number(detailStepButtons[targetIndex].dataset.detailLevel));
    });
  });
  pageLinks.forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    quickNav.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', menuCopy.open);
    menuButton.textContent = menuCopy.menu;
    const targetId = link.getAttribute('href').slice(1);
    const targetIndex = targetId === 'start'
      ? 0
      : storySteps.findIndex((step) => step.id === targetId);
    if (targetIndex >= 0) {
      transitionToPage(targetIndex);
      history.replaceState(null, '', `#${targetId}`);
    }
  }));

  Object.values(MAP_LAYERS).forEach((source) => {
    const image = new Image();
    image.src = source;
  });
  Object.keys(MAP_LAYERS).forEach((layer) => {
    [2, 3, 4].forEach((stage) => {
      const image = new Image();
      image.src = asset(`field-map-layers/intermediate/${layer}-stage-${stage}.png`);
    });
  });
  SAMPLING_LEVELS.forEach((level) => {
    const image = new Image();
    image.src = level.grid;
  });
  const requestedStep = Number.parseInt(new URLSearchParams(location.search).get('step'), 10);
  if (Number.isInteger(requestedStep) && requestedStep >= 0 && requestedStep < storySteps.length) {
    storySteps[requestedStep].scrollIntoView({ behavior: 'auto', block: 'start' });
  } else if (location.hash) {
    const targetId = location.hash.slice(1);
    const targetIndex = targetId === 'start' ? 0 : storySteps.findIndex((step) => step.id === targetId);
    if (targetIndex >= 0) storySteps[targetIndex].scrollIntoView({ behavior: 'auto', block: 'start' });
  }
  setMapLayer('moisture', true);
  updateStoryState();
  window.ARVANOS_FIELD_DEMO = {
    update: updateStoryState,
    trigger: triggerTransition,
    reset: () => scrollTo({ top: 0, behavior: 'auto' }),
  };
})();
