const elements = {
  root: document.documentElement as HTMLElement,
  songList: document.querySelector(".songList") as HTMLElement,
  currentSong: document.querySelector(".currentSong") as HTMLElement,
  pause: document.querySelector(".pause") as HTMLElement,
  play: document.querySelector(".play") as HTMLElement,
  previous: document.querySelector(".previous") as HTMLElement,
  next: document.querySelector(".next") as HTMLElement,
  currentTime: document.querySelector(".currentTime") as HTMLElement,
  duration: document.querySelector(".duration") as HTMLElement,
  seekbar: document.querySelector(".seekbar") as HTMLElement,
  seekbarCircle: document.querySelector(".seekbarCircle") as HTMLElement,
  seekbarActive: document.querySelector(".seekbarActive") as HTMLElement,
  shuffle: document.querySelector(".shuffle") as HTMLElement,
  loop: document.querySelector(".loop") as HTMLElement,
  loopOnce: document.querySelector(".loopOnce") as HTMLElement,
  mute: document.querySelector(".mute") as HTMLElement,
  unmute: document.querySelector(".unmute") as HTMLElement,
  volumebar: document.querySelector(".volumebar") as HTMLElement,
  volumebarActive: document.querySelector(".volumebarActive") as HTMLElement,
  volumebarCircle: document.querySelector(".volumebarCircle") as HTMLElement,
  addToPlaylist: document.querySelector(".addToPlaylist") as HTMLElement,
  lightModeBtn: document.querySelector(".lightModeBtn") as HTMLElement,
  darkModeBtn: document.querySelector(".darkModeBtn") as HTMLElement,
  artists: document.querySelector(".artists") as HTMLElement,
  homeInactive: document.querySelector(".homeInactive") as HTMLElement,
  homeActive: document.querySelector(".homeActive") as HTMLElement,
};

interface Song {
  name: string;
  singer: string;
  image: string;
  url: string;
}
interface LoadedSong {
  name: string;
  singer: string;
  image: string;
  audio: HTMLAudioElement;
}
interface Artist {
  name: string;
  image: string;
  songs: Song[];
}
interface CurrentSong {
  name: string;
  singer: string;
  image: string;
  audio: HTMLAudioElement;
  index: number;
}
interface AudioStatus {
  mute: boolean;
  volume: number;
  seekbarWidth: number;
  volumebarHeight: number;
}
enum LoopOptions {
  off,
  infinite,
  once,
}

let currentSong: CurrentSong = {
  name: "",
  singer: "",
  image: "",
  audio: new Audio(),
  index: -1,
};
let audioStatus: AudioStatus = {
  mute: false,
  volume: 1,
  seekbarWidth: 0,
  volumebarHeight: 100,
};
let darkMode = true;
let shuffle = false;
let loop = LoopOptions.off;
let songsData: Song[] = [];
let songs: HTMLAudioElement[] = [];
let artists: Artist[] = [];
let currentSongDiv: HTMLElement;
let currentSongCardPlayBtn: HTMLElement;
let currentSongCardPauseBtn: HTMLElement;
let totalIndexes: number[] = [];
let shuffleIndexes: number[] = [];
let userPlaylist: Map<string, LoadedSong> = new Map();
let filteredIndexes: number[] = [];
let playingSongTabIndexes: number[] = [];

window.addEventListener("DOMContentLoaded", () => {
  window.addEventListener("load", handleLoad);
  window.addEventListener("beforeunload", handleUnload);

  fetchSongs()
    .then((): void => {
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

function handlePlayerEvents(): void {
  elements.songList.addEventListener("click", (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const songDiv = target.closest(".song") as HTMLDivElement;
    songDiv && playSong(parseInt(songDiv.id));
  });

  elements.artists.addEventListener("click", (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const artistDiv = target.closest(".artist") as HTMLDivElement;
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

async function fetchSongs(): Promise<void> {
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
  } catch (error) {
    throw error;
  }
}

function filterSongs(artist: string): void {
  filteredIndexes = [];
  songsData.filter((song, index) => {
    const searchString = artist.replace("-", " ");
    const isSinger = song.singer.toLowerCase().includes(searchString);
    if (isSinger) {
      filteredIndexes.push(index);
    }
  });
}

function displaySongs(songsToDisplayIndexes: number[]): void {
  const fragment = document.createDocumentFragment();
  songsData.forEach((song, index) => {
    if (songsToDisplayIndexes.includes(index)) {
      const songDiv = document.createElement("div");
      songDiv.classList.add("song", "group");
      songDiv.id = index.toString();
      songDiv.innerHTML = `
        <div class="relative w-full">
          <button class="${
            currentSong.name === song.name ? "hidden" : ""
          } cardPause">
            <svg viewBox="0 0 16 16" class="fill-primary-900 w-5 h-5">
              <path
                d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"
              ></path>
            </svg>
          </button>
          <button class="cardPlay ${
            currentSong.name === song.name ? "" : "hidden"
          }">
            <svg viewBox="0 0 16 16" class="fill-primary-900 w-5 h-5">
              <path
                d="M2.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7H2.7zm8 0a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-2.6z"
              ></path>
            </svg>
          </button>
          <img class="rounded-lg aspect-square" src="${song.image}" alt="${
        song.name
      }"/>
        </div>
        <h3 class="songName">${song.name}</h3>
        <p class="singer">${song.singer}</p>
      `;
      fragment.appendChild(songDiv);
    }
  });
  elements.songList.replaceChildren(fragment);

  currentSongDiv = document.getElementById(
    `${currentSong.index}`
  ) as HTMLElement;

  currentSongCardPlayBtn = currentSongDiv?.querySelector(
    ".cardPlay"
  ) as HTMLElement;

  currentSongCardPauseBtn = currentSongDiv?.querySelector(
    ".cardPause"
  ) as HTMLElement;

  currentSongCardPlayBtn?.addEventListener("click", (e: MouseEvent) => {
    e.stopPropagation();
    togglePlayPause();
  });

  currentSongCardPauseBtn?.addEventListener("click", (e: MouseEvent) => {
    e.stopPropagation();
    togglePlayPause();
  });

  shuffleIndexes = shuffleArray(playingSongTabIndexes);
}

function displayArtists(): void {
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

async function playSong(index: number): Promise<void> {
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

  currentSongDiv = document.getElementById(
    `${currentSong.index}`
  ) as HTMLElement;

  updateUIOnSongPlay();

  playingSongTabIndexes = filteredIndexes;
  currentSong.audio.addEventListener("timeupdate", handleAudioTimeUpdate);
  elements.seekbar.addEventListener("click", updateSeekbar);
  elements.seekbar.addEventListener("mousedown", handleSeekbarDrag);
  currentSong.audio.addEventListener("ended", handleAudioEnd);
}

function updateUIOnSongPlay(): void {
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
    elements.previous.classList.toggle(
      "pointer-events-none",
      currentSong.index === 0
    );
    elements.next.classList.toggle(
      "opacity-50",
      currentSong.index === songs.length - 1
    );
    elements.next.classList.toggle(
      "pointer-events-none",
      currentSong.index === songs.length - 1
    );
  }

  elements.songList.querySelectorAll(".cardPlay")!.forEach((button) => {
    button.classList.add("hidden");
    button.parentNode?.replaceChild(
      button.cloneNode(true) as HTMLElement,
      button
    );
  });

  elements.songList.querySelectorAll(".cardPause")!.forEach((button) => {
    button.classList.remove("hidden");
    button.parentNode?.replaceChild(
      button.cloneNode(true) as HTMLElement,
      button
    );
  });

  currentSongCardPlayBtn = currentSongDiv?.querySelector(
    ".cardPlay"
  ) as HTMLElement;

  currentSongCardPauseBtn = currentSongDiv?.querySelector(
    ".cardPause"
  ) as HTMLElement;

  currentSongCardPlayBtn?.classList.remove("hidden");
  currentSongCardPauseBtn?.classList.add("hidden");

  currentSongCardPlayBtn?.addEventListener("click", (e: MouseEvent) => {
    e.stopPropagation();
    togglePlayPause();
  });

  currentSongCardPauseBtn?.addEventListener("click", (e: MouseEvent) => {
    e.stopPropagation();
    togglePlayPause();
  });
}

function togglePlayPause(): void {
  if (currentSong.index >= 0) {
    if (currentSong.audio.paused) {
      currentSong.audio.play();
      elements.pause.classList.add("hidden");
      elements.play.classList.remove("hidden");
      currentSongCardPauseBtn.classList.add("hidden");
      currentSongCardPlayBtn.classList.remove("hidden");
    } else {
      currentSong.audio.pause();
      elements.play.classList.add("hidden");
      elements.pause.classList.remove("hidden");
      currentSongCardPlayBtn.classList.add("hidden");
      currentSongCardPauseBtn.classList.remove("hidden");
    }
  }
}

const handleAudioEnd = (): void => {
  if (loop === LoopOptions.infinite) {
    playSong(currentSong.index);
  } else if (loop === LoopOptions.once) {
    loop = LoopOptions.off;
    playSong(currentSong.index);
    elements.loopOnce.classList.add("hidden");
    elements.loop.classList.remove("hidden");
  } else if (!shuffle && currentSong.index === songs.length - 1) {
    elements.play.classList.add("hidden");
    elements.pause.classList.remove("hidden");
    currentSongCardPlayBtn.classList.add("hidden");
    currentSongCardPauseBtn.classList.remove("hidden");
  } else {
    nextSong();
  }
};

const handleAudioTimeUpdate = () => {
  if (isFinite(currentSong.audio.duration)) {
    const durationMinutes = Math.floor(currentSong.audio.duration / 60);
    let durationSeconds: string | number = Math.floor(
      currentSong.audio.duration % 60
    );
    if (durationSeconds < 10) {
      durationSeconds = "0" + durationSeconds;
    }
    elements.duration.textContent = `${durationMinutes}:${durationSeconds}`;
    const currentMinutes = Math.floor(currentSong.audio.currentTime / 60);
    let currentSeconds: number | string = Math.floor(
      currentSong.audio.currentTime % 60
    );
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

const updateSeekbar = (e: MouseEvent): void => {
  const seekbarRect = elements.seekbar.getBoundingClientRect();
  const newTime = Math.max(
    0,
    Math.min(
      ((e.clientX - seekbarRect.left) / seekbarRect.width) *
        currentSong.audio.duration,
      currentSong.audio.duration
    )
  );
  if (isFinite(newTime)) {
    currentSong.audio.currentTime = newTime;
    audioStatus.seekbarWidth = (newTime / currentSong.audio.duration) * 100;
    elements.seekbarActive.style.width = `${audioStatus.seekbarWidth}%`;
    elements.seekbarCircle.style.left = `calc(${audioStatus.seekbarWidth}% - 6px)`;
  }
};

const handleSeekbarDrag = (e: MouseEvent) => {
  let isDragging = true;

  const onMouseMove = (event: MouseEvent): void => {
    if (isDragging && currentSong.index >= 0) {
      updateSeekbar(event);
    }
  };

  const stopDrag = (): void => {
    isDragging = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", stopDrag);
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", stopDrag);
  e.preventDefault();
};

const updateVolumeBar = (e: MouseEvent): void => {
  const volumebarRect = elements.volumebar.getBoundingClientRect();
  const newVolume = Math.max(
    0,
    Math.min(1 - (e.clientY - volumebarRect.top) / volumebarRect.height, 1)
  );

  if (isFinite(newVolume)) {
    audioStatus.volume = newVolume;
    currentSong.audio.volume = audioStatus.volume;
    audioStatus.volumebarHeight = audioStatus.volume * 100;
    elements.volumebarActive.style.height = `${audioStatus.volumebarHeight}%`;
    elements.volumebarCircle.style.bottom = `calc(${audioStatus.volumebarHeight}% - 6px)`;
  }
};

const handleVolumeBarDrag = (e: MouseEvent) => {
  let isDragging = true;
  const onMouseMove = (event: MouseEvent): void => {
    if (isDragging) {
      updateVolumeBar(event);
    }
  };
  const stopDrag = (): void => {
    isDragging = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", stopDrag);
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", stopDrag);
  e.preventDefault();
};

const nextSong = (): void => {
  if (currentSong.index >= 0) {
    const researvedIndexes = playingSongTabIndexes;
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
        playSong(randomIndex).then(() => {
          playingSongTabIndexes = researvedIndexes;
        });
      } else {
        playSong(
          shuffleIndexes[shuffleIndexes.indexOf(currentSong.index) + 1]
        ).then(() => {
          playingSongTabIndexes = researvedIndexes;
        });
      }
    } else {
      if (currentSong.index < songs.length - 1) {
        currentSong.index =
          playingSongTabIndexes[
            playingSongTabIndexes.indexOf(currentSong.index) + 1
          ];
        playSong(currentSong.index).then(() => {
          playingSongTabIndexes = researvedIndexes;
        });
      }
    }
  }
};

const previousSong = (): void => {
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
      } else {
        playSong(
          shuffleIndexes[shuffleIndexes.indexOf(currentSong.index) - 1]
        ).then(() => {
          playingSongTabIndexes = researvedIndexes;
        });
      }
    } else {
      if (currentSong.index >= 0) {
        currentSong.index =
          playingSongTabIndexes[
            playingSongTabIndexes.indexOf(currentSong.index) - 1
          ];
        playSong(currentSong.index).then(() => {});
      }
    }
  }
};

const handleShuffle = (): void => {
  shuffle = !shuffle;
  elements.shuffle.classList.toggle("fill-accent-500", shuffle);
  elements.shuffle.classList.toggle("fill-primary-900", !shuffle);
  elements.shuffle.classList.toggle("dark:fill-secondary-200", !shuffle);
  elements.previous.classList.remove("opacity-50", "pointer-events-none");
  elements.next.classList.remove("opacity-50", "pointer-events-none");
};

const handleLoop = (): void => {
  loop = (loop + 1) % 3;
  elements.loop.classList.toggle(
    "fill-accent-500",
    loop === LoopOptions.infinite
  );
  elements.loop.classList.toggle(
    "fill-primary-900",
    loop !== LoopOptions.infinite
  );
  elements.loop.classList.toggle(
    "dark:fill-secondary-200",
    loop !== LoopOptions.infinite
  );
  elements.loopOnce.classList.toggle("hidden", loop !== LoopOptions.once);
  elements.loop.classList.toggle("hidden", loop === LoopOptions.once);
  elements.loop.classList.toggle("hover:fill-accent-500");
};

const handleMuteToggle = (): void => {
  audioStatus.mute = !audioStatus.mute;
  if (currentSong.index >= 0) {
    currentSong.audio.muted = audioStatus.mute;
  }
  elements.mute.classList.toggle("hidden", audioStatus.mute);
  elements.unmute.classList.toggle("hidden", !audioStatus.mute);
};

const toggleTheme = (): void => {
  elements.root.classList.toggle("dark");
  elements.darkModeBtn.classList.toggle("hidden");
  elements.lightModeBtn.classList.toggle("hidden");
  darkMode = !darkMode;
};

function shuffleArray(arrayToShuffle: number[]): number[] {
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

const handleKeyboardEvents = (e: KeyboardEvent) => {
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
      }
    }
  }
};

const handleLoad = (): void => {
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
    const userPlaylistArray: [string, LoadedSong][] =
      JSON.parse(storedUserPlaylist);
    userPlaylist = new Map(userPlaylistArray);
  }
};

const handleUnload = (): void => {
  localStorage.setItem("darkMode", darkMode.toString());

  const userPlaylistArray: [string, LoadedSong][] = Array.from(
    userPlaylist.entries()
  );
  localStorage.setItem("userPlaylist", JSON.stringify(userPlaylistArray));

  localStorage.setItem(
    "leftedSong",
    JSON.stringify({
      name: currentSong.name,
      singer: currentSong.singer,
      image: currentSong.image,
      index: currentSong.index,
      currentTime: currentSong.audio.currentTime,
      seekbarWidth: audioStatus.seekbarWidth,
      volume: audioStatus.volume,
      mute: audioStatus.mute,
      volumebarHeight: audioStatus.volumebarHeight,
    })
  );
};
