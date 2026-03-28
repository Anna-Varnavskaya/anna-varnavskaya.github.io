document.addEventListener('DOMContentLoaded', () => {
  initQuoteHover();
  initSubscribeModal();
  initStrikeHammer();
  initConsciousnessAssembler();
  initEvaluateVoting();
});

function initQuoteHover() {
  const quoteLines = document.querySelectorAll('.hero__quote');

  quoteLines.forEach((line) => {
    wrapQuoteLetters(line);
  });
}

function wrapQuoteLetters(element) {
  const sourceNodes = Array.from(element.childNodes);
  const fragment = document.createDocumentFragment();

  sourceNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      for (const char of text) {
        if (char === ' ') {
          fragment.appendChild(document.createTextNode(' '));
          continue;
        }

        const span = document.createElement('span');
        span.className = 'hero__letter';
        span.textContent = char;
        fragment.appendChild(span);
      }
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE && node.nodeName === 'BR') {
      fragment.appendChild(document.createElement('br'));
    }
  });

  element.textContent = '';
  element.appendChild(fragment);
}

function initSubscribeModal() {
  const trigger = document.querySelector('.hero__subscribe');
  const modal = document.getElementById('subscribe-modal');
  const form = document.getElementById('subscribe-form');
  const input = document.getElementById('subscribe-email');

  if (!trigger || !modal || !form || !input) {
    return;
  }

  const openModal = () => {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    input.focus();
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    form.reset();
  };

  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    openModal();
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!input.checkValidity()) {
      input.reportValidity();
      return;
    }

    closeModal();
  });
}

function initEvaluateVoting() {
  const imageQueue = [
    { id: 1, src: './assets/images/evaluate/evaluate_foto1.svg' },
    { id: 2, src: './assets/images/evaluate/evaluate_foto2.svg' },
    { id: 3, src: './assets/images/evaluate/evaluate_foto3.svg' },
    { id: 4, src: './assets/images/evaluate/evaluate_foto4.svg' },
    { id: 5, src: './assets/images/evaluate/evaluate_foto5.svg' },
    { id: 6, src: './assets/images/evaluate/evaluate_foto6.svg' },
    { id: 7, src: './assets/images/evaluate/evaluate_foto7.svg' },
    { id: 8, src: './assets/images/evaluate/evaluate_foto9.svg' }
  ];

  const currentImage = document.getElementById('evaluate-current-image') || document.querySelector('.evaluate__circle--center img');
  const leftPreview = document.getElementById('evaluate-preview-left') || document.querySelector('.evaluate__circle--left img');
  const rightPreview = document.getElementById('evaluate-preview-right') || document.querySelector('.evaluate__circle--right img');
  const progress = document.getElementById('evaluate-progress');
  const resetButton = document.getElementById('evaluate-reset');
  const dislikeButton = document.querySelector('.evaluate__action--dislike');
  const likeButton = document.querySelector('.evaluate__action--like');
  const undoButton = document.getElementById('evaluate-undo');
  const bubbles = document.querySelectorAll('.consciousness__bubble[data-image-id]');

  if (!currentImage || !leftPreview || !rightPreview || !dislikeButton || !likeButton || !resetButton || !undoButton) {
    return;
  }

  let currentIndex = 0;
  const decisions = new Map();
  const history = [];
  let isAnimating = false;

  const getWrappedIndex = (index) => {
    const total = imageQueue.length;
    return ((index % total) + total) % total;
  };

  const emitEvaluateState = () => {
    const payload = {};

    imageQueue.forEach((item) => {
      if (decisions.has(item.id)) {
        payload[item.id] = decisions.get(item.id);
      }
    });

    window.dispatchEvent(
      new CustomEvent('somnius:evaluate-updated', {
        detail: { decisions: payload }
      })
    );
  };

  const syncBubbles = () => {
    if (!bubbles.length) {
      emitEvaluateState();
      return;
    }

    bubbles.forEach((bubble) => {
      const id = Number(bubble.dataset.imageId);
      const decision = decisions.get(id);
      bubble.classList.toggle('is-disliked', decision === 'dislike');
      bubble.classList.toggle('is-liked', decision === 'like');
    });

    emitEvaluateState();
  };

  const updateActionState = () => {
    const hasCurrentCard = currentIndex < imageQueue.length;

    likeButton.disabled = !hasCurrentCard || isAnimating;
    dislikeButton.disabled = !hasCurrentCard || isAnimating;
    undoButton.disabled = history.length === 0 || isAnimating;
    resetButton.disabled = (history.length === 0 && currentIndex === 0) || isAnimating;
  };

  const renderStep = (enterFrom) => {
    const total = imageQueue.length;

    currentImage.classList.remove(
      'is-entering',
      'is-swipe-left',
      'is-swipe-right',
      'is-return-from-left',
      'is-return-from-right'
    );

    if (currentIndex >= total) {
      currentImage.style.opacity = '0';
      currentImage.removeAttribute('src');
      currentImage.alt = 'Все образы оценены';

      const prev = imageQueue[getWrappedIndex(currentIndex - 1)];
      const fallbackNext = imageQueue[0];
      leftPreview.src = prev.src;
      rightPreview.src = fallbackNext.src;

      if (progress) {
        progress.textContent = total + '/' + total;
      }

      updateActionState();
      return;
    }

    const current = imageQueue[currentIndex];
    const prev = imageQueue[getWrappedIndex(currentIndex - 1)];
    const next = imageQueue[getWrappedIndex(currentIndex + 1)];

    currentImage.style.opacity = '1';
    currentImage.src = current.src;
    currentImage.alt = 'Образ ' + (currentIndex + 1);
    leftPreview.src = prev.src;
    rightPreview.src = next.src;

    if (enterFrom === 'left') {
      requestAnimationFrame(() => {
        currentImage.classList.add('is-return-from-left');
      });
    } else if (enterFrom === 'right') {
      requestAnimationFrame(() => {
        currentImage.classList.add('is-return-from-right');
      });
    } else {
      requestAnimationFrame(() => {
        currentImage.classList.add('is-entering');
      });
    }

    if (progress) {
      progress.textContent = history.length + '/' + total;
    }

    updateActionState();
  };

  const runSwipe = (decision) => {
    if (isAnimating || currentIndex >= imageQueue.length) {
      return;
    }

    isAnimating = true;
    updateActionState();

    const swipeClass = decision === 'like' ? 'is-swipe-right' : 'is-swipe-left';
    const current = imageQueue[currentIndex];
    currentImage.classList.remove('is-entering', 'is-return-from-left', 'is-return-from-right');
    currentImage.classList.add(swipeClass);

    const finalizeSwipe = () => {
      currentImage.removeEventListener('animationend', finalizeSwipe);
      currentImage.classList.remove(swipeClass);

      decisions.set(current.id, decision);
      history.push({
        id: current.id,
        decision,
        index: currentIndex
      });
      syncBubbles();

      currentIndex += 1;
      isAnimating = false;
      renderStep();
    };

    currentImage.addEventListener('animationend', finalizeSwipe, { once: true });
  };

  const undoLastVote = () => {
    if (isAnimating || history.length === 0) {
      return;
    }

    const lastVote = history.pop();
    decisions.delete(lastVote.id);
    syncBubbles();

    currentIndex = lastVote.index;
    renderStep(lastVote.decision === 'like' ? 'right' : 'left');
  };

  const resetVotes = () => {
    if (isAnimating) {
      return;
    }

    history.length = 0;
    decisions.clear();
    syncBubbles();
    currentIndex = 0;
    renderStep();
  };

  dislikeButton.addEventListener('click', () => runSwipe('dislike'));
  likeButton.addEventListener('click', () => runSwipe('like'));
  undoButton.addEventListener('click', undoLastVote);
  resetButton.addEventListener('click', resetVotes);

  syncBubbles();
  renderStep();
}

function initConsciousnessAssembler() {
  const scene = document.querySelector('.consciousness');
  const dropzone = scene ? scene.querySelector('.consciousness__head-dropzone') : null;
  const smile = scene ? scene.querySelector('.consciousness__smile') : null;
  const bubblesWrap = scene ? scene.querySelector('.consciousness__bubbles') : null;
  const bubbles = scene ? Array.from(scene.querySelectorAll('.consciousness__bubble[data-image-id]')) : [];

  if (!scene || !dropzone || !smile || !bubblesWrap || !bubbles.length) {
    return;
  }

  const bubbleById = new Map();
  const desktopBasePositions = new Map();
  const title = scene.querySelector('.consciousness__title');
  const desktopHeadSlots = {
    1: [{ x: 50, y: 35 }],
    2: [
      { x: 35, y: 34 },
      { x: 65, y: 34 }
    ],
    3: [
      { x: 33, y: 33 },
      { x: 67, y: 33 },
      { x: 50, y: 52 }
    ],
    4: [
      { x: 32, y: 32 },
      { x: 68, y: 32 },
      { x: 32, y: 52 },
      { x: 68, y: 52 }
    ],
    5: [
      { x: 26, y: 30 },
      { x: 50, y: 28 },
      { x: 74, y: 30 },
      { x: 38, y: 50 },
      { x: 62, y: 50 }
    ],
    6: [
      { x: 24, y: 30 },
      { x: 50, y: 28 },
      { x: 76, y: 30 },
      { x: 24, y: 50 },
      { x: 50, y: 50 },
      { x: 76, y: 50 }
    ],
    7: [
      { x: 24, y: 28 },
      { x: 50, y: 26 },
      { x: 76, y: 28 },
      { x: 24, y: 46 },
      { x: 50, y: 46 },
      { x: 76, y: 46 },
      { x: 50, y: 62 }
    ],
    8: [
      { x: 18, y: 26 },
      { x: 38, y: 24 },
      { x: 62, y: 24 },
      { x: 82, y: 26 },
      { x: 18, y: 44 },
      { x: 38, y: 44 },
      { x: 62, y: 44 },
      { x: 82, y: 44 }
    ]
  };
  const mobileHeadSlots = {
    1: [{ x: 50, y: 12 }],
    2: [
      { x: 36, y: 12 },
      { x: 64, y: 12 }
    ],
    3: [
      { x: 34, y: 12 },
      { x: 66, y: 12 },
      { x: 50, y: 34 }
    ],
    4: [
      { x: 33, y: 12 },
      { x: 67, y: 12 },
      { x: 33, y: 34 },
      { x: 67, y: 34 }
    ],
    5: [
      { x: 27, y: 12 },
      { x: 50, y: 12 },
      { x: 73, y: 12 },
      { x: 38, y: 34 },
      { x: 62, y: 34 }
    ],
    6: [
      { x: 24, y: 12 },
      { x: 50, y: 12 },
      { x: 76, y: 12 },
      { x: 24, y: 34 },
      { x: 50, y: 34 },
      { x: 76, y: 34 }
    ],
    7: [
      { x: 20, y: 12 },
      { x: 40, y: 12 },
      { x: 60, y: 12 },
      { x: 80, y: 12 },
      { x: 28, y: 34 },
      { x: 50, y: 34 },
      { x: 72, y: 34 }
    ],
    8: [
      { x: 18, y: 12 },
      { x: 38, y: 12 },
      { x: 62, y: 12 },
      { x: 82, y: 12 },
      { x: 18, y: 34 },
      { x: 38, y: 34 },
      { x: 62, y: 34 },
      { x: 82, y: 34 }
    ]
  };

  let decisionsById = {};
  let likedIds = [];
  let requiredCount = 0;
  let placedOrder = [];
  let dragState = null;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const isMobileView = () => window.matchMedia('(max-width: 640px)').matches;
  const hasLike = (id) => likedIds.includes(id);
  const isPlaced = (id) => placedOrder.includes(id);
  const getHeadSlots = (count, mobile) => {
    const bank = mobile ? mobileHeadSlots : desktopHeadSlots;
    return bank[count] || bank[8];
  };

  bubbles.forEach((bubble) => {
    bubbleById.set(Number(bubble.dataset.imageId), bubble);
  });

  const clearSummonState = (bubble) => {
    bubble.classList.remove('is-summoned');
    bubble.style.removeProperty('--summon-x');
    bubble.style.removeProperty('--summon-y');
    bubble.style.removeProperty('--summon-delay');
    bubble.style.removeProperty('--summon-duration');
  };

  const getWrapRect = () => bubblesWrap.getBoundingClientRect();
  const getWrapMetrics = () => {
    const rect = getWrapRect();
    const layoutWidth = bubblesWrap.clientWidth || 1;
    const layoutHeight = bubblesWrap.clientHeight || 1;
    const scaleX = rect.width / layoutWidth || 1;
    const scaleY = rect.height / layoutHeight || 1;

    return { rect, scaleX, scaleY };
  };

  const getDropMetricsInWrap = () => {
    const wrap = getWrapMetrics();
    const dropRect = dropzone.getBoundingClientRect();
    const left = (dropRect.left - wrap.rect.left) / wrap.scaleX;
    const top = (dropRect.top - wrap.rect.top) / wrap.scaleY;
    const width = dropRect.width / wrap.scaleX;
    const height = dropRect.height / wrap.scaleY;

    return {
      left,
      top,
      width,
      height,
      cx: left + width / 2,
      cy: top + height / 2,
      rx: width / 2,
      ry: height / 2
    };
  };

  const captureDesktopBasePositions = () => {
    if (isMobileView()) {
      return;
    }

    bubbles.forEach((bubble) => {
      const id = Number(bubble.dataset.imageId);
      if (!desktopBasePositions.has(id)) {
        desktopBasePositions.set(id, {
          left: bubble.offsetLeft,
          top: bubble.offsetTop,
          width: bubble.offsetWidth
        });
      }
    });
  };

  const setBubblePosition = (bubble, left, top) => {
    bubble.style.left = left + 'px';
    bubble.style.top = top + 'px';
  };

  const getBubbleCenterInWrap = (bubble) => {
    return {
      x: bubble.offsetLeft + bubble.offsetWidth / 2,
      y: bubble.offsetTop + bubble.offsetHeight / 2
    };
  };

  const isInsideDropzone = (bubble) => {
    const center = getBubbleCenterInWrap(bubble);
    const drop = getDropMetricsInWrap();
    const nx = (center.x - drop.cx) / drop.rx;
    const ny = (center.y - drop.cy) / drop.ry;
    return nx * nx + ny * ny <= 1;
  };

  const updateSmileState = () => {
    const likedSet = new Set(likedIds);
    const likedPlacedCount = placedOrder.filter((id) => likedSet.has(id)).length;
    const isComplete = requiredCount > 0 && likedPlacedCount >= requiredCount;
    smile.classList.toggle('consciousness__smile--happy', isComplete);
  };

  const resetBubbleUiState = (bubble) => {
    bubble.classList.remove('is-in-head', 'is-dragging');
    clearSummonState(bubble);
    bubble.style.removeProperty('z-index');
    bubble.style.removeProperty('pointer-events');
  };

  const restoreDesktopBubble = (bubble, id) => {
    const base = desktopBasePositions.get(id);
    if (!base) {
      return;
    }

    bubble.style.width = base.width + 'px';
    bubble.style.left = base.left + 'px';
    bubble.style.top = base.top + 'px';
  };

  const clearBubblePosition = (bubble) => {
    bubble.style.removeProperty('left');
    bubble.style.removeProperty('top');
    bubble.style.removeProperty('width');
  };

  const layoutPlacedBubbles = () => {
    if (!placedOrder.length) {
      return;
    }

    const drop = getDropMetricsInWrap();
    const slots = getHeadSlots(placedOrder.length, isMobileView());

    placedOrder.forEach((id, index) => {
      const bubble = bubbleById.get(id);
      const slot = slots[Math.min(index, slots.length - 1)];
      if (!bubble || !slot) {
        return;
      }

      const centerX = drop.left + (slot.x / 100) * drop.width;
      const centerY = drop.top + (slot.y / 100) * drop.height;
      const bubbleWidth = bubble.offsetWidth || Number.parseFloat(getComputedStyle(bubble).width) || 100;
      const bubbleHeight = bubble.offsetHeight || bubbleWidth;

      setBubblePosition(bubble, centerX - bubbleWidth / 2, centerY - bubbleHeight / 2);
      bubble.classList.add('is-in-head');
      clearSummonState(bubble);
    });
  };

  const layoutMobileLikePool = () => {
    if (!isMobileView()) {
      bubblesWrap.style.removeProperty('height');
      return;
    }

    const unplacedLikedIds = likedIds.filter((id) => !isPlaced(id));
    const wrapRect = getWrapRect();
    const drop = getDropMetricsInWrap();
    const wrapWidth = wrapRect.width || scene.clientWidth || 360;
    const maxCols = 3;
    const gapX = 10;
    const gapY = 10;

    let topStart = 18;
    if (title) {
      const titleRect = title.getBoundingClientRect();
      topStart = Math.max(18, Math.round(titleRect.bottom - wrapRect.top + 10));
    }

    const topLimit = Math.max(topStart + 64, Math.round(drop.top - 12));
    const rows = Math.max(1, Math.ceil(unplacedLikedIds.length / maxCols));
    const cols = Math.min(maxCols, Math.max(1, unplacedLikedIds.length));
    const maxByWidth = Math.floor((wrapWidth - 20 - gapX * (cols - 1)) / cols);
    const maxByHeight = Math.floor((topLimit - topStart - gapY * (rows - 1)) / rows);
    const itemSize = clamp(Math.min(maxByWidth, maxByHeight), 56, 102);

    let cursor = 0;
    let row = 0;
    while (cursor < unplacedLikedIds.length) {
      const rowCount = Math.min(maxCols, unplacedLikedIds.length - cursor);
      const rowWidth = rowCount * itemSize + (rowCount - 1) * gapX;
      const rowStartX = Math.round((wrapWidth - rowWidth) / 2);

      for (let col = 0; col < rowCount; col += 1) {
        const id = unplacedLikedIds[cursor + col];
        const bubble = bubbleById.get(id);
        if (!bubble) {
          continue;
        }

        bubble.style.width = itemSize + 'px';
        setBubblePosition(bubble, rowStartX + col * (itemSize + gapX), topStart + row * (itemSize + gapY));
      }

      cursor += rowCount;
      row += 1;
    }

    bubblesWrap.style.height = scene.clientHeight + 'px';
  };

  const restoreUnplacedDesktopBubbles = () => {
    if (isMobileView()) {
      return;
    }

    bubbles.forEach((bubble) => {
      const id = Number(bubble.dataset.imageId);
      if (isPlaced(id)) {
        return;
      }
      restoreDesktopBubble(bubble, id);
    });
  };

  const applySummonMotion = () => {
    const likedSet = new Set(likedIds);
    const placedLikeCount = placedOrder.filter((id) => likedSet.has(id)).length;
    const isComplete = requiredCount > 0 && placedLikeCount >= requiredCount;

    bubbles.forEach((bubble) => {
      if (bubble.classList.contains('is-in-head')) {
        clearSummonState(bubble);
      }
    });

    if (requiredCount === 0 || isComplete) {
      bubbles.forEach((bubble) => {
        clearSummonState(bubble);
      });
      return;
    }

    const drop = getDropMetricsInWrap();
    const freeLikes = likedIds.filter((id) => !isPlaced(id));
    const duration = Math.max(2.2, freeLikes.length * 0.55);

    freeLikes.forEach((id, index) => {
      const bubble = bubbleById.get(id);
      if (!bubble || bubble.classList.contains('is-in-head')) {
        return;
      }

      const center = getBubbleCenterInWrap(bubble);
      const moveX = clamp((drop.cx - center.x) * 0.12, -24, 24);
      const moveY = clamp((drop.cy - center.y) * 0.12, -24, 24);

      bubble.style.setProperty('--summon-x', moveX.toFixed(2) + 'px');
      bubble.style.setProperty('--summon-y', moveY.toFixed(2) + 'px');
      bubble.style.setProperty('--summon-delay', (index * 0.2).toFixed(2) + 's');
      bubble.style.setProperty('--summon-duration', duration.toFixed(2) + 's');
      bubble.classList.add('is-summoned');
    });
  };

  const layoutAllBubbles = () => {
    if (isMobileView()) {
      layoutMobileLikePool();
    } else {
      restoreUnplacedDesktopBubbles();
      bubblesWrap.style.removeProperty('height');
    }

    layoutPlacedBubbles();
    updateSmileState();
    applySummonMotion();
  };

  const syncFromDecisions = () => {
    if (!isMobileView()) {
      captureDesktopBasePositions();
    }

    likedIds = Object.entries(decisionsById)
      .filter(([, decision]) => decision === 'like')
      .map(([id]) => Number(id));
    requiredCount = Math.min(4, likedIds.length);
    const likedSet = new Set(likedIds);

    placedOrder = placedOrder.filter((id) => likedSet.has(id));

    bubbles.forEach((bubble) => {
      const id = Number(bubble.dataset.imageId);
      const decision = decisionsById[id];
      const isLiked = decision === 'like';
      const isDisliked = decision === 'dislike';

      resetBubbleUiState(bubble);
      bubble.classList.toggle('is-liked', isLiked);
      bubble.classList.toggle('is-disliked', isDisliked && !isMobileView());
      bubble.classList.toggle('is-mobile-visible', isMobileView() && isLiked);

      if (isMobileView()) {
        if (isLiked) {
          bubble.style.display = 'block';
        } else {
          bubble.style.display = 'none';
          clearBubblePosition(bubble);
        }
      } else {
        bubble.style.removeProperty('display');
        if (!isPlaced(id)) {
          restoreDesktopBubble(bubble, id);
        }
      }

      if (!isLiked) {
        bubble.classList.remove('is-in-head');
      }
    });

    layoutAllBubbles();
  };

  const placeBubbleIntoHead = (id) => {
    if (!hasLike(id) || isPlaced(id)) {
      return;
    }

    placedOrder.push(id);
    layoutAllBubbles();
  };

  const handlePointerDown = (event, bubble) => {
    const id = Number(bubble.dataset.imageId);
    if (!hasLike(id) || isPlaced(id)) {
      return;
    }

    const bubbleRect = bubble.getBoundingClientRect();
    dragState = {
      id,
      pointerId: event.pointerId,
      offsetX: event.clientX - bubbleRect.left,
      offsetY: event.clientY - bubbleRect.top
    };

    bubble.classList.add('is-dragging');
    clearSummonState(bubble);
    bubble.style.setProperty('z-index', '9');
    bubble.style.setProperty('pointer-events', 'none');

    if (bubble.setPointerCapture) {
      bubble.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
  };

  const handlePointerMove = (event) => {
    if (!dragState || event.pointerId !== dragState.pointerId) {
      return;
    }

    const bubble = bubbleById.get(dragState.id);
    if (!bubble) {
      return;
    }

    const wrap = getWrapMetrics();
    const nextLeft = (event.clientX - wrap.rect.left - dragState.offsetX) / wrap.scaleX;
    const nextTop = (event.clientY - wrap.rect.top - dragState.offsetY) / wrap.scaleY;

    setBubblePosition(bubble, nextLeft, nextTop);
  };

  const handlePointerEnd = (event) => {
    if (!dragState || event.pointerId !== dragState.pointerId) {
      return;
    }

    const bubble = bubbleById.get(dragState.id);
    const id = dragState.id;
    dragState = null;

    if (!bubble) {
      return;
    }

    bubble.classList.remove('is-dragging');
    bubble.style.removeProperty('pointer-events');
    bubble.style.removeProperty('z-index');

    if (bubble.hasPointerCapture && bubble.hasPointerCapture(event.pointerId)) {
      bubble.releasePointerCapture(event.pointerId);
    }

    if (isInsideDropzone(bubble)) {
      placeBubbleIntoHead(id);
      return;
    }

    layoutAllBubbles();
  };

  bubbles.forEach((bubble) => {
    bubble.addEventListener('pointerdown', (event) => handlePointerDown(event, bubble));
  });

  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerEnd);
  window.addEventListener('pointercancel', handlePointerEnd);

  window.addEventListener('resize', () => {
    if (dragState) {
      return;
    }

    desktopBasePositions.clear();
    bubbles.forEach((bubble) => {
      bubble.style.removeProperty('left');
      bubble.style.removeProperty('top');
      bubble.style.removeProperty('width');
    });
    requestAnimationFrame(() => {
      captureDesktopBasePositions();
      syncFromDecisions();
    });
  });

  window.addEventListener('somnius:evaluate-updated', (event) => {
    const detail = event.detail && typeof event.detail === 'object' ? event.detail : {};
    decisionsById = detail.decisions && typeof detail.decisions === 'object' ? detail.decisions : {};
    syncFromDecisions();
  });

  requestAnimationFrame(() => {
    captureDesktopBasePositions();
    syncFromDecisions();
  });
}

function initStrikeHammer() {
  const strike = document.querySelector('.strike');
  const hammer = strike ? strike.querySelector('.strike__hammer') : null;
  const resetButton = strike ? strike.querySelector('.strike__reset') : null;

  if (!strike || !hammer) {
    return;
  }

  let step = 0;
  const maxStep = 3;
  let isAnimating = false;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  const applyStrikeStep = () => {
    strike.classList.remove('strike--state-0', 'strike--state-1', 'strike--state-2', 'strike--state-3');
    strike.classList.add('strike--state-' + step);
    strike.classList.toggle('strike--engaged', step > 0);
  };

  const playHammerSound = () => {
    if (!AudioCtx) {
      return;
    }

    if (!audioCtx) {
      audioCtx = new AudioCtx();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    gain.connect(audioCtx.destination);

    const low = audioCtx.createOscillator();
    low.type = 'triangle';
    low.frequency.setValueAtTime(160, now);
    low.frequency.exponentialRampToValueAtTime(62, now + 0.14);
    low.connect(gain);
    low.start(now);
    low.stop(now + 0.16);

    const click = audioCtx.createOscillator();
    click.type = 'square';
    click.frequency.setValueAtTime(820, now);
    click.frequency.exponentialRampToValueAtTime(260, now + 0.05);
    click.connect(gain);
    click.start(now);
    click.stop(now + 0.06);
  };

  const runHammerHit = (angle, onImpact) => {
    const duration = 420;
    const impactDelay = Math.round(duration * 0.52);
    hammer.classList.add('is-hitting');

    const hitAnimation = hammer.animate(
      [
        { transform: 'rotate(0deg)', offset: 0 },
        { transform: 'rotate(' + -angle + 'deg)', offset: 0.52 },
        { transform: 'rotate(0deg)', offset: 1 }
      ],
      {
        duration,
        easing: 'cubic-bezier(0.22, 0.72, 0.2, 1)',
        fill: 'forwards'
      }
    );

    hitAnimation.addEventListener(
      'finish',
      () => {
        hitAnimation.cancel();
      },
      { once: true }
    );

    window.setTimeout(() => {
      playHammerSound();
      onImpact();
    }, impactDelay);

    window.setTimeout(() => {
      hammer.classList.remove('is-hitting');
      isAnimating = false;
    }, duration + 20);
  };

  hammer.addEventListener('click', () => {
    if (isAnimating || step >= maxStep) {
      return;
    }

    isAnimating = true;
    const nextStep = Math.min(step + 1, maxStep);
    const angle = nextStep === 1 ? 20 : nextStep === 2 ? 40 : 60;

    runHammerHit(angle, () => {
      if (step < maxStep) {
        step = nextStep;
        applyStrikeStep();
      }
    });
  });

  if (resetButton) {
    resetButton.addEventListener('click', () => {
      if (isAnimating) {
        return;
      }

      hammer.getAnimations().forEach((animation) => animation.cancel());
      hammer.classList.remove('is-hitting');
      step = 0;
      applyStrikeStep();

      hammer.style.animation = 'none';
      requestAnimationFrame(() => {
        hammer.style.animation = '';
      });
    });
  }

  applyStrikeStep();
}
