"use strict";
const elements = {
    root: document.documentElement,
    themeBtn: document.getElementById("theme-btn"),
    songList: document.querySelector(".songList"),
    currentSong: document.querySelector(".currentSong"),
    pause: document.querySelector(".pause"),
    play: document.querySelector(".play"),
    previous: document.querySelector(".previous"),
    next: document.querySelector(".next"),
    currentTime: document.querySelector(".currentTime"),
    duration: document.querySelector(".duration"),
    seekbar: document.querySelector(".seekbar"),
    seekbarCircle: document.querySelector(".seekbarCircle"),
    seekbarActive: document.querySelector(".seekbarActive"),
    shuffle: document.querySelector(".shuffle"),
    loop: document.querySelector(".loop"),
    loopOnce: document.querySelector(".loopOnce"),
    mute: document.querySelector(".mute"),
    unmute: document.querySelector(".unmute"),
    volumebar: document.querySelector(".volumebar"),
    volumebarActive: document.querySelector(".volumebarActive"),
    volumebarCircle: document.querySelector(".volumebarCircle"),
};
var LoopOptions;
(function (LoopOptions) {
    LoopOptions[LoopOptions["off"] = 0] = "off";
    LoopOptions[LoopOptions["infinite"] = 1] = "infinite";
    LoopOptions[LoopOptions["once"] = 2] = "once";
})(LoopOptions || (LoopOptions = {}));
let currentSong = {
    name: "",
    singer: "",
    image: "",
    audio: new Audio(),
    index: -1,
};
let audioStatus = {
    mute: false,
    volume: 1,
    seekbarWidth: 0,
    volumebarHeight: 100,
};
let darkMode = true;
let shuffle = false;
let loop = LoopOptions.off;
let songsData = [];
let songs = [];
let currentSongDiv;
let currentSongCardPlayBtn;
let currentSongCardPauseBtn;
let totalIndexes = [];
let shuffleIndexes = [];
async function fetchSongs() {
    try {
        const response = await fetch("./songs.json");
        const data = await response.json();
        if (data) {
            songsData = data;
            songsData.forEach((song, index) => {
                const audio = new Audio(song.url);
                songs.push(audio);
                totalIndexes.push(index);
            });
        }
    }
    catch (error) {
        throw error;
    }
}
function displaySongs(songsToDisplayIndexes) {
    const fragment = document.createDocumentFragment();
    songsData.forEach((song, index) => {
        if (songsToDisplayIndexes.includes(index)) {
            const songDiv = document.createElement("div");
            songDiv.classList.add("song", "group");
            songDiv.id = index.toString();
            songDiv.innerHTML = `
        <div class="relative w-full">
          <button class="${currentSong.name === song.name ? "hidden" : ""} cardPause">
            <svg viewBox="0 0 16 16" class="fill-primary-900 w-5 h-5">
              <path
                d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"
              ></path>
            </svg>
          </button>
          <button class="cardPlay ${currentSong.name === song.name ? "" : "hidden"}">
            <svg viewBox="0 0 16 16" class="fill-primary-900 w-5 h-5">
              <path
                d="M2.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7H2.7zm8 0a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-2.6z"
              ></path>
            </svg>
          </button>
          <img class="rounded-lg aspect-square" src="${song.image}" alt="${song.name}"/>
        </div>
        <h3 class="songName">${song.name}</h3>
        <p class="singer">${song.singer}</p>
      `;
            fragment.appendChild(songDiv);
        }
    });
    elements.songList.replaceChildren(fragment);
    currentSongDiv = document.getElementById(`${currentSong.index}`);
    currentSongCardPlayBtn = currentSongDiv?.querySelector(".cardPlay");
    currentSongCardPauseBtn = currentSongDiv?.querySelector(".cardPause");
    currentSongCardPlayBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        togglePlayPause();
    });
    currentSongCardPauseBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        togglePlayPause();
    });
    shuffleIndexes = shuffleArray(totalIndexes);
}
async function playSong(index) {
    currentSong.audio.pause();
    currentSong = {
        name: songsData[index].name,
        singer: songsData[index].singer,
        image: songsData[index].image,
        audio: songs[index],
        index: index,
    };
    currentSong.audio.preload = "auto";
    currentSong.audio.load();
    currentSong.audio.currentTime = 0;
    currentSong.audio.volume = audioStatus.volume;
    currentSong.audio.muted = audioStatus.mute;
    await currentSong.audio.play();
    currentSongDiv = document.getElementById(`${currentSong.index}`);
    updateUIOnSongPlay();
    currentSong.audio.addEventListener("timeupdate", handleAudioTimeUpdate);
    elements.seekbar.addEventListener("click", updateSeekbar);
    elements.seekbar.addEventListener("mousedown", handleSeekbarDrag);
    currentSong.audio.addEventListener("ended", handleAudioEnd);
}
function updateUIOnSongPlay() {
    elements.currentSong.innerHTML = `
    <img
      class="h-12 rounded-md"
      src="${currentSong.image}"
      alt="${currentSong.name}"
    />
    <div>
      <h4 class="text-md font-bold dark:font-normal">
        ${currentSong.name}
      </h4>
      <p class="text-xs font-bold dark:font-normal text-primary-900/60 dark:text-secondary-500">${currentSong.singer}</p>
    </div>
  `;
    elements.pause.classList.add("hidden");
    elements.play.classList.remove("hidden");
    document.title = `${currentSong.name} • ${currentSong.singer}`;
    if (!shuffle) {
        elements.previous.classList.toggle("opacity-50", currentSong.index === 0);
        elements.previous.classList.toggle("pointer-events-none", currentSong.index === 0);
        elements.next.classList.toggle("opacity-50", currentSong.index === songs.length - 1);
        elements.next.classList.toggle("pointer-events-none", currentSong.index === songs.length - 1);
    }
    elements.songList.querySelectorAll(".cardPlay").forEach((button) => {
        button.classList.add("hidden");
        button.parentNode?.replaceChild(button.cloneNode(true), button);
    });
    elements.songList.querySelectorAll(".cardPause").forEach((button) => {
        button.classList.remove("hidden");
        button.parentNode?.replaceChild(button.cloneNode(true), button);
    });
    currentSongCardPlayBtn = currentSongDiv?.querySelector(".cardPlay");
    currentSongCardPauseBtn = currentSongDiv?.querySelector(".cardPause");
    currentSongCardPlayBtn?.classList.remove("hidden");
    currentSongCardPauseBtn?.classList.add("hidden");
    currentSongCardPlayBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        togglePlayPause();
    });
    currentSongCardPauseBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        togglePlayPause();
    });
}
function togglePlayPause() {
    if (currentSong.index >= 0) {
        if (currentSong.audio.paused) {
            currentSong.audio.play();
            elements.pause.classList.add("hidden");
            elements.play.classList.remove("hidden");
            currentSongCardPauseBtn.classList.add("hidden");
            currentSongCardPlayBtn.classList.remove("hidden");
        }
        else {
            currentSong.audio.pause();
            elements.play.classList.add("hidden");
            elements.pause.classList.remove("hidden");
            currentSongCardPlayBtn.classList.add("hidden");
            currentSongCardPauseBtn.classList.remove("hidden");
        }
    }
}
const handleAudioEnd = () => {
    if (loop === LoopOptions.infinite) {
        playSong(currentSong.index);
    }
    else if (loop === LoopOptions.once) {
        loop = LoopOptions.off;
        playSong(currentSong.index);
        elements.loopOnce.classList.add("hidden");
        elements.loop.classList.remove("hidden");
    }
    else if (!shuffle && currentSong.index === songs.length - 1) {
        elements.play.classList.add("hidden");
        elements.pause.classList.remove("hidden");
        currentSongCardPlayBtn.classList.add("hidden");
        currentSongCardPauseBtn.classList.remove("hidden");
    }
    else {
        nextSong();
    }
};
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
        audioStatus.seekbarWidth =
            (currentSong.audio.currentTime / currentSong.audio.duration) * 100;
        elements.seekbarActive.style.width = `${audioStatus.seekbarWidth}%`;
        elements.seekbarCircle.style.left = `calc(${audioStatus.seekbarWidth}% - 6px)`;
    }
};
const updateSeekbar = (e) => {
    const seekbarRect = elements.seekbar.getBoundingClientRect();
    const newTime = Math.max(0, Math.min(((e.clientX - seekbarRect.left) / seekbarRect.width) *
        currentSong.audio.duration, currentSong.audio.duration));
    if (isFinite(newTime)) {
        currentSong.audio.currentTime = newTime;
        audioStatus.seekbarWidth = (newTime / currentSong.audio.duration) * 100;
        elements.seekbarActive.style.width = `${audioStatus.seekbarWidth}%`;
        elements.seekbarCircle.style.left = `calc(${audioStatus.seekbarWidth}% - 6px)`;
    }
};
const handleSeekbarDrag = (e) => {
    let isDragging = true;
    const onMouseMove = (event) => {
        if (isDragging && currentSong.index >= 0) {
            updateSeekbar(event);
        }
    };
    const stopDrag = () => {
        isDragging = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", stopDrag);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", stopDrag);
    e.preventDefault();
};
const updateVolumeBar = (e) => {
    const volumebarRect = elements.volumebar.getBoundingClientRect();
    const newVolume = Math.max(0, Math.min(1 - (e.clientY - volumebarRect.top) / volumebarRect.height, 1));
    if (isFinite(newVolume)) {
        audioStatus.volume = newVolume;
        currentSong.audio.volume = audioStatus.volume;
        audioStatus.volumebarHeight = audioStatus.volume * 100;
        elements.volumebarActive.style.height = `${audioStatus.volumebarHeight}%`;
        elements.volumebarCircle.style.bottom = `calc(${audioStatus.volumebarHeight}% - 6px)`;
    }
};
const handleVolumeBarDrag = (e) => {
    let isDragging = true;
    const onMouseMove = (event) => {
        if (isDragging) {
            updateVolumeBar(event);
        }
    };
    const stopDrag = () => {
        isDragging = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", stopDrag);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", stopDrag);
    e.preventDefault();
};
const nextSong = () => {
    if (currentSong.index >= 0) {
        if (shuffle) {
            if (shuffleIndexes.indexOf(currentSong.index) ===
                shuffleIndexes.length - 1) {
                let randomIndex = Math.floor(Math.random() * shuffleIndexes.length);
                randomIndex =
                    randomIndex === currentSong.index
                        ? Math.floor(Math.random() * shuffleIndexes.length)
                        : randomIndex;
                playSong(randomIndex);
            }
            else {
                playSong(shuffleIndexes[shuffleIndexes.indexOf(currentSong.index) + 1]);
            }
        }
        else {
            if (currentSong.index < songs.length - 1) {
                currentSong.index =
                    totalIndexes[totalIndexes.indexOf(currentSong.index) + 1];
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
            }
            else {
                playSong(shuffleIndexes[shuffleIndexes.indexOf(currentSong.index) - 1]);
            }
        }
        else {
            if (currentSong.index >= 0) {
                currentSong.index =
                    totalIndexes[totalIndexes.indexOf(currentSong.index) - 1];
                playSong(currentSong.index);
            }
        }
    }
};
const handleShuffle = () => {
    shuffle = !shuffle;
    elements.shuffle.classList.toggle("fill-accent-500", shuffle);
    elements.shuffle.classList.toggle("fill-primary-900", !shuffle);
    elements.shuffle.classList.toggle("dark:fill-secondary-200", !shuffle);
    elements.previous.classList.remove("opacity-50", "pointer-events-none");
    elements.next.classList.remove("opacity-50", "pointer-events-none");
};
const handleLoop = () => {
    loop = (loop + 1) % 3;
    elements.loop.classList.toggle("fill-accent-500", loop === LoopOptions.infinite);
    elements.loop.classList.toggle("fill-primary-900", loop !== LoopOptions.infinite);
    elements.loop.classList.toggle("dark:fill-secondary-200", loop !== LoopOptions.infinite);
    elements.loopOnce.classList.toggle("hidden", loop !== LoopOptions.once);
    elements.loop.classList.toggle("hidden", loop === LoopOptions.once);
    elements.loop.classList.toggle("hover:fill-accent-500");
};
const handleMuteToggle = () => {
    audioStatus.mute = !audioStatus.mute;
    if (currentSong.index >= 0) {
        currentSong.audio.muted = audioStatus.mute;
    }
    elements.mute.classList.toggle("hidden", audioStatus.mute);
    elements.unmute.classList.toggle("hidden", !audioStatus.mute);
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
    if (currentSong.index >= 0) {
        const activeElement = document.activeElement;
        const isInputField = activeElement instanceof HTMLInputElement ||
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
            }
        }
    }
};
const handleLoad = () => {
    const storedDarkMode = localStorage.getItem("darkMode");
    changeTheme(storedDarkMode
        ? storedDarkMode === "true"
        : window.matchMedia("(prefers-color-scheme: dark)").matches);
    const storedSongData = localStorage.getItem("leftedSong");
    if (storedSongData) {
        const leftedSongData = JSON.parse(storedSongData);
    }
};
const handleUnload = () => {
    localStorage.setItem("leftedSong", JSON.stringify({
        name: currentSong.name,
        singer: currentSong.singer,
        image: currentSong.image,
        index: currentSong.index,
        currentTime: currentSong.audio.currentTime,
        seekbarWidth: audioStatus.seekbarWidth,
        volume: audioStatus.volume,
        mute: audioStatus.mute,
        volumebarHeight: audioStatus.volumebarHeight,
    }));
};
function handlePlayerEvents() {
    elements.songList.addEventListener("click", (event) => {
        const target = event.target;
        const songDiv = target.closest(".song");
        songDiv && playSong(parseInt(songDiv.id));
    });
    elements.themeBtn.addEventListener("click", () => {
        changeTheme(!darkMode);
    });
    elements.play.addEventListener("click", togglePlayPause);
    elements.pause.addEventListener("click", togglePlayPause);
    elements.previous.addEventListener("click", previousSong);
    elements.next.addEventListener("click", nextSong);
    elements.shuffle.addEventListener("click", handleShuffle);
    elements.loop.addEventListener("click", handleLoop);
    elements.loopOnce.addEventListener("click", handleLoop);
    elements.mute.addEventListener("click", handleMuteToggle);
    elements.unmute.addEventListener("click", handleMuteToggle);
    elements.volumebar.addEventListener("mousedown", handleVolumeBarDrag);
    window.addEventListener("keydown", handleKeyboardEvents);
    navigator.mediaSession.setActionHandler("pause", togglePlayPause);
    navigator.mediaSession.setActionHandler("play", togglePlayPause);
    navigator.mediaSession.setActionHandler("previoustrack", previousSong);
    navigator.mediaSession.setActionHandler("nexttrack", nextSong);
}
window.addEventListener("DOMContentLoaded", () => {
    window.addEventListener("load", handleLoad);
    window.addEventListener("beforeunload", handleUnload);
    fetchSongs()
        .then(() => {
        displaySongs(totalIndexes);
        handlePlayerEvents();
    })
        .catch((error) => {
        elements.songList.classList.remove("grid", "grid-cols-6", "gap-5");
        const errorUI = document.createElement("h3");
        errorUI.classList.add("mt-2", "text-xl", "text-accent-500");
        errorUI.textContent = "Sorry! Unable to find any song.";
        elements.songList.appendChild(errorUI);
        console.log("ERROR: Unable to fetch songs.", error);
    });
});
