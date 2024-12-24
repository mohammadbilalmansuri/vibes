"use strict";
(() => {
  const elements = {
    root: document.documentElement,
    themeBtn: document.getElementById("theme-btn"),
    songs: document.getElementById("songs"),
    currentSong: document.getElementById("currentSong"),
    playPause: document.getElementById("play-pause"),
    previous: document.getElementById("previous"),
    next: document.getElementById("next"),
    shuffle: document.getElementById("shuffle"),
    loop: document.getElementById("loop"),
    currentTime: document.getElementById("currentTime"),
    duration: document.getElementById("duration"),
    seekbar: document.getElementById("seekbar"),
    seekbarCircle: document.getElementById("seekbarCircle"),
    seekbarActive: document.getElementById("seekbarActive"),
  };
  let LoopOptions;
  (function (LoopOptions) {
    LoopOptions[(LoopOptions["off"] = 0)] = "off";
    LoopOptions[(LoopOptions["infinite"] = 1)] = "infinite";
    LoopOptions[(LoopOptions["once"] = 2)] = "once";
  })(LoopOptions || (LoopOptions = {}));
  let currentSong = {
    name: "",
    singer: "",
    image: "",
    url: "",
    audio: new Audio(),
    index: -1,
    volume: 1,
    seekbarWidth: 0,
  };
  let darkMode = true;
  let shuffle = false;
  let loop = LoopOptions.off;
  let songs = new Map();
  let currentSongDiv;
  let currentSongBtn;
  let indexes = [];
  let shuffleIndexes = [];
  async function fetchSongs() {
    try {
      const response = await fetch("./songs.json");
      let data = await response.json();
      if (data) {
        data
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach((songData, index) => {
            const song = {
              name: songData.name,
              singer: songData.singer,
              image: songData.image,
              url: songData.url,
              audio: new Audio(songData.url),
            };
            songs.set(index, song);
            indexes.push(index);
          });
      }
    } catch (error) {
      throw error;
    }
  }
  function displaySongs() {
    const fragment = document.createDocumentFragment();
    songs.forEach((song, index) => {
      const { name, singer, image } = song;
      const songDiv = document.createElement("div");
      songDiv.classList.add("song", "group");
      songDiv.id = index.toString();
      songDiv.innerHTML = `
          <div class="w-full flex items-center xl:gap-4 gap-2.5">
            <img class="md:size-16 size-12 lg:rounded-lg rounded" src="${image}" alt="${name}"/>
            <div>
              <h3 class="songName">${name}</h3>
              <p class="singer">${singer}</p>
            </div>
          </div>
          <button class="songIcon">
            <svg viewBox="0 0 16 16" class="size-4 fill-primary-800 dark:fill-secondary-200">
              <path
                d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"
              />
            </svg>
          </button>
        `;
      fragment.appendChild(songDiv);
    });
    elements.songs.replaceChildren(fragment);
    shuffleIndexes = shuffleArray(indexes);
  }
  function renderPlayPauseIcon(play, isPlayerBtn) {
    return `<svg viewBox="0 0 16 16" class="${
      isPlayerBtn ? "xs:size-5 size-4" : "size-4"
    }"><path d="${
      play
        ? "M2.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7H2.7zm8 0a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-2.6z"
        : "M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"
    }"/></svg>`;
  }
  function renderLoopIcon(loop) {
    switch (loop) {
      case LoopOptions.once:
        return `<svg viewBox="0 0 16 16" class="xs:size-4 size-3.5 fill-accent"><path d="M0 4.75A3.75 3.75 0 0 1 3.75 1h.75v1.5h-.75A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5v1.5H3.75A3.75 3.75 0 0 1 0 9.75v-5zM12.25 2.5h-.75V1h.75A3.75 3.75 0 0 1 16 4.75v5a3.75 3.75 0 0 1-3.75 3.75H9.81l1.018 1.018a.75.75 0 1 1-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 1 1 1.06 1.06L9.811 12h2.439a2.25 2.25 0 0 0 2.25-2.25v-5a2.25 2.25 0 0 0-2.25-2.25z"/><path d="M9.12 8V1H7.787c-.128.72-.76 1.293-1.787 1.313V3.36h1.57V8h1.55z"/></svg>`;
      case LoopOptions.infinite:
        return `<svg viewBox="0 0 16 16" class="xs:size-4 size-3.5 fill-accent"><path d="M0 4.75A3.75 3.75 0 0 1 3.75 1h8.5A3.75 3.75 0 0 1 16 4.75v5a3.75 3.75 0 0 1-3.75 3.75H9.81l1.018 1.018a.75.75 0 1 1-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 1 1 1.06 1.06L9.811 12h2.439a2.25 2.25 0 0 0 2.25-2.25v-5a2.25 2.25 0 0 0-2.25-2.25h-8.5A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5v1.5H3.75A3.75 3.75 0 0 1 0 9.75v-5z"/></svg>`;
      case LoopOptions.off:
        return `<svg viewBox="0 0 16 16" class="xs:size-4 size-3.5 fill-primary-800 dark:fill-secondary-200"><path d="M0 4.75A3.75 3.75 0 0 1 3.75 1h8.5A3.75 3.75 0 0 1 16 4.75v5a3.75 3.75 0 0 1-3.75 3.75H9.81l1.018 1.018a.75.75 0 1 1-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 1 1 1.06 1.06L9.811 12h2.439a2.25 2.25 0 0 0 2.25-2.25v-5a2.25 2.25 0 0 0-2.25-2.25h-8.5A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5v1.5H3.75A3.75 3.75 0 0 1 0 9.75v-5z"/></svg>`;
    }
  }
  function changePlayPauseIcons(play) {
    elements.playPause.innerHTML = renderPlayPauseIcon(play, true);
    currentSongBtn.innerHTML = renderPlayPauseIcon(play, false);
    currentSongBtn.classList.toggle("playingSongIcon", play);
  }
  function renderCurrentSong(playing = true) {
    elements.currentSong.innerHTML = `
        <img class="lg:size-12 sm:size-10 size-8 lg:rounded-lg rounded" src="${currentSong.image}" alt="${currentSong.name}"/>
        <div class="flex flex-col">
          <h4 class="songName">${currentSong.name}</h4>
          <p class="singer">${currentSong.singer}</p>
        </div>
      `;
    if (playing) {
      elements.songs.querySelectorAll(".songIcon").forEach((button) => {
        button.innerHTML = renderPlayPauseIcon(false, false);
        button.classList.remove("playingSongIcon");
        button.parentNode?.replaceChild(button.cloneNode(true), button);
      });
    }
    currentSongBtn = currentSongDiv.querySelector(".songIcon");
    changePlayPauseIcons(playing);
    document.title = `${currentSong.name} • ${currentSong.singer}`;
    currentSongBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      togglePlayPause();
    });
    if (!shuffle) {
      elements.previous.classList.toggle("opacity-50", currentSong.index === 0);
      elements.previous.classList.toggle(
        "pointer-events-none",
        currentSong.index === 0
      );
      elements.next.classList.toggle(
        "opacity-50",
        currentSong.index === songs.size - 1
      );
      elements.next.classList.toggle(
        "pointer-events-none",
        currentSong.index === songs.size - 1
      );
    }
  }
  async function togglePlayPause() {
    if (currentSong.index >= 0) {
      if (currentSong.audio.paused) {
        try {
          await currentSong.audio.play();
          changePlayPauseIcons(true);
        } catch (error) {
          console.error("Error playing audio:", error);
        }
      } else {
        currentSong.audio.pause();
        changePlayPauseIcons(false);
      }
    }
  }
  async function playSong(index, play = true) {
    currentSong.audio.pause();
    const song = songs.get(index);
    if (!song) return;
    currentSong = {
      ...currentSong,
      name: song.name,
      singer: song.singer,
      image: song.image,
      url: song.url,
      audio: song.audio,
      index: index,
    };
    currentSong.audio.preload = "auto";
    currentSong.audio.load();
    currentSong.audio.currentTime = 0;
    currentSong.audio.volume = currentSong.volume;
    currentSongDiv = document.getElementById(`${index}`);
    if (play) {
      await currentSong.audio.play();
      renderCurrentSong();
      localStorage.setItem("currentSongIndex", index.toString());
    } else {
      renderCurrentSong(false);
      await new Promise((resolve) => setTimeout(resolve, 500));
      handleAudioTimeUpdate();
    }
    currentSong.audio.addEventListener("timeupdate", handleAudioTimeUpdate);
    elements.seekbar.addEventListener("click", (e) => {
      e.preventDefault();
      updateSeekbar(e.clientX);
    });
    elements.seekbar.addEventListener("mousedown", handleSeekbarDrag);
    elements.seekbar.addEventListener("touchstart", handleSeekbarDrag);
    currentSong.audio.addEventListener("ended", handleAudioEnd);
  }
  const handleAudioTimeUpdate = () => {
    if (isFinite(currentSong.audio.duration)) {
      const durationMinutes = Math.floor(currentSong.audio.duration / 60);
      let durationSeconds = Math.floor(currentSong.audio.duration % 60);
      if (durationSeconds < 10) {
        durationSeconds = "0" + durationSeconds;
      }
      elements.duration.textContent = `${durationMinutes}:${durationSeconds}`;
      const currentMinutes = Math.floor(currentSong.audio.currentTime / 60);
      let currentSeconds = Math.floor(currentSong.audio.currentTime % 60);
      if (currentSeconds < 10) {
        currentSeconds = "0" + currentSeconds;
      }
      elements.currentTime.textContent = `${currentMinutes}:${currentSeconds}`;
      currentSong.seekbarWidth =
        (currentSong.audio.currentTime / currentSong.audio.duration) * 100;
      elements.seekbarActive.style.width = `${currentSong.seekbarWidth}%`;
      elements.seekbarCircle.style.left = `calc(${currentSong.seekbarWidth}% - 6px)`;
    }
  };
  const updateSeekbar = (clientX) => {
    const seekbarRect = elements.seekbar.getBoundingClientRect();
    const newTime = Math.max(
      0,
      Math.min(
        ((clientX - seekbarRect.left) / seekbarRect.width) *
          currentSong.audio.duration,
        currentSong.audio.duration
      )
    );
    if (isFinite(newTime)) {
      currentSong.audio.currentTime = newTime;
      currentSong.seekbarWidth = (newTime / currentSong.audio.duration) * 100;
      elements.seekbarActive.style.width = `${currentSong.seekbarWidth}%`;
      elements.seekbarCircle.style.left = `calc(${currentSong.seekbarWidth}% - 6px)`;
    }
  };
  const handleSeekbarDrag = (e) => {
    let isDragging = true;
    let newTime = 0;
    e.preventDefault();
    currentSong.audio.removeEventListener("timeupdate", handleAudioTimeUpdate);
    const onMove = (event) => {
      if (isDragging && currentSong.index >= 0) {
        const clientX =
          event instanceof MouseEvent
            ? event.clientX
            : event.touches[0].clientX;
        const seekbarRect = elements.seekbar.getBoundingClientRect();
        newTime = Math.max(
          0,
          Math.min(
            ((clientX - seekbarRect.left) / seekbarRect.width) *
              currentSong.audio.duration,
            currentSong.audio.duration
          )
        );
        if (isFinite(newTime)) {
          const seekbarWidth = (newTime / currentSong.audio.duration) * 100;
          elements.seekbarActive.style.width = `${seekbarWidth}%`;
          elements.seekbarCircle.style.left = `calc(${seekbarWidth}% - 6px)`;
        }
      }
    };
    const stopDrag = () => {
      isDragging = false;
      if (isFinite(newTime)) {
        currentSong.audio.currentTime = newTime;
      }
      currentSong.audio.addEventListener("timeupdate", handleAudioTimeUpdate);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", stopDrag);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", stopDrag);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", stopDrag);
    document.addEventListener("touchmove", onMove);
    document.addEventListener("touchend", stopDrag);
  };
  const handleAudioEnd = () => {
    if (loop === LoopOptions.infinite) {
      playSong(currentSong.index);
    } else if (loop === LoopOptions.once) {
      loop = LoopOptions.off;
      playSong(currentSong.index);
      elements.loop.innerHTML = renderLoopIcon(loop);
    } else if (!shuffle && currentSong.index === songs.size - 1) {
      changePlayPauseIcons(false);
    } else {
      nextSong();
    }
  };
  const nextSong = () => {
    if (currentSong.index >= 0) {
      if (shuffle) {
        if (
          shuffleIndexes.indexOf(currentSong.index) ===
          shuffleIndexes.length - 1
        ) {
          let randomIndex = Math.floor(Math.random() * shuffleIndexes.length);
          randomIndex =
            randomIndex === currentSong.index
              ? Math.floor(Math.random() * shuffleIndexes.length)
              : randomIndex;
          playSong(randomIndex);
        } else {
          playSong(
            shuffleIndexes[shuffleIndexes.indexOf(currentSong.index) + 1]
          );
        }
      } else {
        if (currentSong.index < songs.size - 1) {
          currentSong.index = indexes[indexes.indexOf(currentSong.index) + 1];
          playSong(currentSong.index);
        }
      }
    }
  };
  const previousSong = () => {
    if (currentSong.index >= 0) {
      if (shuffle) {
        if (shuffleIndexes.indexOf(currentSong.index) === 0) {
          let randomIndex = Math.floor(Math.random() * shuffleIndexes.length);
          randomIndex =
            randomIndex === currentSong.index
              ? Math.floor(Math.random() * shuffleIndexes.length)
              : randomIndex;
          playSong(randomIndex);
        } else {
          playSong(
            shuffleIndexes[shuffleIndexes.indexOf(currentSong.index) - 1]
          );
        }
      } else {
        if (currentSong.index >= 0) {
          currentSong.index = indexes[indexes.indexOf(currentSong.index) - 1];
          playSong(currentSong.index);
        }
      }
    }
  };
  const handleShuffle = () => {
    shuffle = !shuffle;
    elements.shuffle.classList.toggle("fill-accent", shuffle);
    elements.shuffle.classList.toggle("fill-primary-800", !shuffle);
    elements.shuffle.classList.toggle("dark:fill-secondary-200", !shuffle);
    elements.previous.classList.remove("opacity-50", "pointer-events-none");
    elements.next.classList.remove("opacity-50", "pointer-events-none");
  };
  const changeTheme = (isDarkMode) => {
    elements.root.classList.toggle("dark", isDarkMode);
    elements.themeBtn.innerHTML = isDarkMode
      ? `<svg viewBox="0 0 24 24" class="size-5"><path d="m17.715 15.15.95.316a1 1 0 0 0-1.445-1.185l.495.869ZM9 6.035l.846.534a1 1 0 0 0-1.14-1.49L9 6.035Zm8.221 8.246a5.47 5.47 0 0 1-2.72.718v2a7.47 7.47 0 0 0 3.71-.98l-.99-1.738Zm-2.72.718A5.5 5.5 0 0 1 9 9.5H7a7.5 7.5 0 0 0 7.5 7.5v-2ZM9 9.5c0-1.079.31-2.082.845-2.93L8.153 5.5A7.47 7.47 0 0 0 7 9.5h2Zm-4 3.368C5 10.089 6.815 7.75 9.292 6.99L8.706 5.08C5.397 6.094 3 9.201 3 12.867h2Zm6.042 6.136C7.718 19.003 5 16.268 5 12.867H3c0 4.48 3.588 8.136 8.042 8.136v-2Zm5.725-4.17c-.81 2.433-3.074 4.17-5.725 4.17v2c3.552 0 6.553-2.327 7.622-5.537l-1.897-.632Z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M17 3a1 1 0 0 1 1 1 2 2 0 0 0 2 2 1 1 0 1 1 0 2 2 2 0 0 0-2 2 1 1 0 1 1-2 0 2 2 0 0 0-2-2 1 1 0 1 1 0-2 2 2 0 0 0 2-2 1 1 0 0 1 1-1Z"/></svg>`
      : `<svg class="size-5 stroke-primary-800 dark:stroke-secondary-200" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/><path d="M12 4v1M17.66 6.344l-.828.828M20.005 12.004h-1M17.66 17.664l-.828-.828M12 20.01V19M6.34 17.664l.835-.836M3.995 12.004h1.01M6 6l.835.836"/></svg>`;
    darkMode = isDarkMode;
    localStorage.setItem("darkMode", String(isDarkMode));
  };
  function shuffleArray(arrayToShuffle) {
    const array = arrayToShuffle.slice();
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  const handleKeyboardEvents = (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === "KeyI") e.preventDefault();
    if (currentSong.index >= 0) {
      const activeElement = document.activeElement;
      const isInputField =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement;
      if (!isInputField) {
        switch (e.code) {
          case "Space":
            e.preventDefault();
            togglePlayPause();
            break;
          case "ArrowLeft":
            e.preventDefault();
            previousSong();
            break;
          case "ArrowRight":
            e.preventDefault();
            nextSong();
            break;
          case "ArrowUp":
            e.preventDefault();
            if (currentSong.audio.volume === 1) return;
            currentSong.audio.volume = Math.min(
              1,
              currentSong.audio.volume + 0.2
            );
            currentSong.volume = currentSong.audio.volume;
            break;
          case "ArrowDown":
            e.preventDefault();
            if (currentSong.audio.volume === 0) return;
            currentSong.audio.volume = Math.max(
              0,
              currentSong.audio.volume - 0.2
            );
            currentSong.volume = currentSong.audio.volume;
            break;
        }
      }
    }
  };
  function handlePlayerEvents() {
    elements.songs.addEventListener("click", (event) => {
      const target = event.target;
      const songDiv = target.closest(".song");
      songDiv && playSong(parseInt(songDiv.id));
    });
    elements.themeBtn.addEventListener("click", () => {
      changeTheme(!darkMode);
    });
    elements.playPause.addEventListener("click", togglePlayPause);
    elements.previous.addEventListener("click", previousSong);
    elements.next.addEventListener("click", nextSong);
    elements.shuffle.addEventListener("click", handleShuffle);
    elements.loop.addEventListener("click", () => {
      loop = (loop + 1) % 3;
      elements.loop.innerHTML = renderLoopIcon(loop);
    });
    window.addEventListener("contextmenu", (e) => e.preventDefault());
    window.addEventListener("keydown", handleKeyboardEvents);
    navigator.mediaSession.setActionHandler("pause", togglePlayPause);
    navigator.mediaSession.setActionHandler("play", togglePlayPause);
    navigator.mediaSession.setActionHandler("previoustrack", previousSong);
    navigator.mediaSession.setActionHandler("nexttrack", nextSong);
  }
  window.addEventListener("DOMContentLoaded", () => {
    const storedDarkMode = localStorage.getItem("darkMode");
    changeTheme(
      storedDarkMode
        ? storedDarkMode === "true"
        : window.matchMedia("(prefers-color-scheme: dark)").matches
    );
    const storedCurrentSongIndex = localStorage.getItem("currentSongIndex");
    if (storedCurrentSongIndex)
      currentSong.index = parseInt(storedCurrentSongIndex);
    fetchSongs()
      .then(() => {
        displaySongs();
        handlePlayerEvents();
        if (currentSong.index >= 0) {
          playSong(currentSong.index, false);
        }
      })
      .catch((error) => {
        const errorUI = document.createElement("p");
        errorUI.classList.add(
          "text-lg",
          "h-full",
          "flex",
          "items-center",
          "justify-center",
          "animate-pulse"
        );
        errorUI.textContent = "Sorry! Unable to find any song";
        elements.songs.replaceWith(errorUI);
        console.log("Error while fetching songs", error);
      });
  });
})();
