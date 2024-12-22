"use strict";
const elements = {
    root: document.documentElement,
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
    addToPlaylist: document.querySelector(".addToPlaylist"),
    lightModeBtn: document.querySelector(".lightModeBtn"),
    darkModeBtn: document.querySelector(".darkModeBtn"),
    artists: document.querySelector(".artists"),
    homeInactive: document.querySelector(".homeInactive"),
    homeActive: document.querySelector(".homeActive"),
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
let artists = [];
let currentSongDiv;
let currentSongCardPlayBtn;
let currentSongCardPauseBtn;
let totalIndexes = [];
let shuffleIndexes = [];
let userPlaylist = new Map();
let filteredIndexes = [];
let playingSongTabIndexes = [];
window.addEventListener("DOMContentLoaded", () => {
    window.addEventListener("load", handleLoad);
    window.addEventListener("beforeunload", handleUnload);
    fetchSongs()
        .then(() => {
        filteredIndexes = totalIndexes;
        playingSongTabIndexes = totalIndexes;
        displaySongs(filteredIndexes);
        displayArtists();
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
function handlePlayerEvents() {
    elements.songList.addEventListener("click", (event) => {
        const target = event.target;
        const songDiv = target.closest(".song");
        songDiv && playSong(parseInt(songDiv.id));
    });
    elements.artists.addEventListener("click", (event) => {
        const target = event.target;
        const artistDiv = target.closest(".artist");
        if (artistDiv) {
            if (currentSong.index >= 0) {
                playingSongTabIndexes = filteredIndexes;
            }
            filterSongs(artistDiv.id);
            displaySongs(filteredIndexes);
            elements.homeActive.classList.add("hidden");
            elements.homeInactive.classList.remove("hidden");
        }
    });
    elements.homeInactive.addEventListener("click", () => {
        if (currentSong.index >= 0) {
            playingSongTabIndexes = filteredIndexes;
        }
        filteredIndexes = totalIndexes;
        displaySongs(filteredIndexes);
        elements.homeInactive.classList.add("hidden");
        elements.homeActive.classList.remove("hidden");
    });
    elements.darkModeBtn.addEventListener("click", toggleTheme);
    elements.lightModeBtn.addEventListener("click", toggleTheme);
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
    elements.addToPlaylist.addEventListener("click", handleAddToPlaylist);
    navigator.mediaSession.setActionHandler("pause", togglePlayPause);
    navigator.mediaSession.setActionHandler("play", togglePlayPause);
    navigator.mediaSession.setActionHandler("previoustrack", previousSong);
    navigator.mediaSession.setActionHandler("nexttrack", nextSong);
}
async function fetchSongs() {
    try {
        const response = await fetch("./songs.json");
        const data = await response.json();
        if (data) {
            songsData = data.songs;
            artists = data.artists;
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
function filterSongs(artist) {
    filteredIndexes = [];
    songsData.filter((song, index) => {
        const searchString = artist.replace("-", " ");
        const isSinger = song.singer.toLowerCase().includes(searchString);
        if (isSinger) {
            filteredIndexes.push(index);
        }
    });
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
    shuffleIndexes = shuffleArray(playingSongTabIndexes);
}
function displayArtists() {
    const fragment = document.createDocumentFragment();
    artists.forEach((artist) => {
        const artistDiv = document.createElement("div");
        artistDiv.classList.add("artist", "group");
        artistDiv.id = artist.name.toLowerCase().replace(/[ ]/, "-");
        artistDiv.innerHTML = `
      <img
        class="rounded-full aspect-square w-3/4 object-cover object-top group-hover:scale-105 transition-all"
        src="${artist.image}"
        alt="${artist.name}"
      />
      <p class="text-xs font-medium dark:font-normal">${artist.name}</p>
    `;
        fragment.appendChild(artistDiv);
    });
    elements.artists.replaceChildren(fragment);
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
    playingSongTabIndexes = filteredIndexes;
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
    elements.addToPlaylist.classList.remove("hidden");
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
        const researvedIndexes = playingSongTabIndexes;
        if (shuffle) {
            if (shuffleIndexes.indexOf(currentSong.index) ===
                shuffleIndexes.length - 1) {
                let randomIndex = Math.floor(Math.random() * shuffleIndexes.length);
                randomIndex =
                    randomIndex === currentSong.index
                        ? Math.floor(Math.random() * shuffleIndexes.length)
                        : randomIndex;
                playSong(randomIndex).then(() => {
                    playingSongTabIndexes = researvedIndexes;
                });
            }
            else {
                playSong(shuffleIndexes[shuffleIndexes.indexOf(currentSong.index) + 1]).then(() => {
                    playingSongTabIndexes = researvedIndexes;
                });
            }
        }
        else {
            if (currentSong.index < songs.length - 1) {
                currentSong.index =
                    playingSongTabIndexes[playingSongTabIndexes.indexOf(currentSong.index) + 1];
                playSong(currentSong.index).then(() => {
                    playingSongTabIndexes = researvedIndexes;
                });
            }
        }
    }
};
const previousSong = () => {
    if (currentSong.index >= 0) {
        const researvedIndexes = playingSongTabIndexes;
        if (shuffle) {
            if (shuffleIndexes.indexOf(currentSong.index) === 0) {
                let randomIndex = Math.floor(Math.random() * shuffleIndexes.length);
                randomIndex =
                    randomIndex === currentSong.index
                        ? Math.floor(Math.random() * shuffleIndexes.length)
                        : randomIndex;
                playSong(randomIndex).then(() => {
                    playingSongTabIndexes = researvedIndexes;
                });
            }
            else {
                playSong(shuffleIndexes[shuffleIndexes.indexOf(currentSong.index) - 1]).then(() => {
                    playingSongTabIndexes = researvedIndexes;
                });
            }
        }
        else {
            if (currentSong.index >= 0) {
                currentSong.index =
                    playingSongTabIndexes[playingSongTabIndexes.indexOf(currentSong.index) - 1];
                playSong(currentSong.index).then(() => { });
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
const toggleTheme = () => {
    elements.root.classList.toggle("dark");
    elements.darkModeBtn.classList.toggle("hidden");
    elements.lightModeBtn.classList.toggle("hidden");
    darkMode = !darkMode;
};
function shuffleArray(arrayToShuffle) {
    const array = arrayToShuffle.slice();
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
const handleAddToPlaylist = () => {
    const songIdentifier = `${currentSong.name}-${currentSong.singer}`;
    if (!userPlaylist.has(songIdentifier)) {
        userPlaylist.set(songIdentifier, currentSong);
    }
    console.log(userPlaylist);
};
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
    storedDarkMode
        ? (darkMode = storedDarkMode === "true")
        : (darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches);
    elements.root.classList.toggle("dark", darkMode);
    darkMode
        ? elements.darkModeBtn.classList.remove("hidden")
        : elements.lightModeBtn.classList.remove("hidden");
    const storedSongData = localStorage.getItem("leftedSong");
    if (storedSongData) {
        const leftedSongData = JSON.parse(storedSongData);
    }
    const storedUserPlaylist = localStorage.getItem("userPlaylist");
    if (storedUserPlaylist) {
        const userPlaylistArray = JSON.parse(storedUserPlaylist);
        userPlaylist = new Map(userPlaylistArray);
    }
};
const handleUnload = () => {
    localStorage.setItem("darkMode", darkMode.toString());
    const userPlaylistArray = Array.from(userPlaylist.entries());
    localStorage.setItem("userPlaylist", JSON.stringify(userPlaylistArray));
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
