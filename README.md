<div align="center">

<img src="assets/logo.png" width="220" alt="ThemeDeck" />

# ThemeDeck per Windows

### Ogni gioco ha il suo tema musicale.

Musica per le pagine dei giochi, l'interfaccia e lo Store di Steam, con ricerca, download e controlli pensati per Gaming Mode.

[![Release](https://img.shields.io/github/v/release/LoZazaMastro/ThemeDeck-Windows?style=for-the-badge&label=Release&labelColor=111111&color=ffffff)](https://github.com/LoZazaMastro/ThemeDeck-Windows/releases/latest)
[![Licenza BSD-3-Clause](https://img.shields.io/badge/Licenza-BSD--3--Clause-ffffff?style=for-the-badge&labelColor=111111)](LICENSE)

</div>

## La colonna sonora della tua libreria

ThemeDeck per Windows è un fork di [ThemeDeck](https://github.com/BrenticusMaximus/ThemeDeck) adattato a Decky Loader su Windows. Il plugin continua a chiamarsi **ThemeDeck** dentro Decky.

- riproduzione automatica di un tema nella pagina del gioco;
- scelta di file locali o ricerca YouTube tramite `yt-dlp`;
- anteprima, download e assegnazione dei risultati;
- volume, punto di inizio e loop separati per gioco;
- volume generale dedicato ai temi dei giochi;
- brano ambientale per l'interfaccia e brano separato per lo Store;
- assegnazione automatica dei temi mancanti con esclusioni per gioco;
- durata massima di 15 minuti per le assegnazioni automatiche da YouTube;
- pulizia di tutti i download gestiti o soltanto di quelli non più assegnati;
- arresto automatico quando un gioco viene avviato.

ThemeDeck mette in pausa la propria musica mentre Now Playing riproduce audio integrato o locale e quando Steam mostra un video udibile di avvio, Community, notizie o Store. La riproduzione muta di TrailerHero viene ignorata.

## File locali e download

Quando sostituisci un tema ambientale o dello Store scaricato dal plugin, il vecchio file viene eliminato soltanto se era gestito da ThemeDeck. I file selezionati dalle tue cartelle non vengono mai cancellati.

**Elimina tutti i download** rimuove la cartella gestita e le relative assegnazioni. **Elimina download inutilizzati** tocca soltanto i file non assegnati a un gioco, all'ambiente o allo Store.

## Lingue

La lingua segue automaticamente Steam. Sono incluse traduzioni per inglese, italiano, francese, spagnolo, portoghese, portoghese brasiliano, tedesco, olandese, ucraino, cinese e giapponese.

## Installazione

Puoi installare e aggiornare ThemeDeck dal Plugin Store di [Playhub](https://github.com/LoZazaMastro/Playhub), oppure manualmente:

1. scarica lo ZIP dall'[ultima release](https://github.com/LoZazaMastro/ThemeDeck-Windows/releases/latest);
2. abilita la modalità sviluppatore di Decky;
3. scegli **Decky → Impostazioni → Sviluppatore → Installa plugin da ZIP**;
4. apri le opzioni di un gioco e scegli ThemeDeck per assegnargli un brano.

La release Windows include `yt-dlp.exe`, `ffmpeg.exe` e `ffprobe.exe`; se YouTube cambia comportamento, l'aggiornamento di `yt-dlp` dalle impostazioni può ripristinare ricerca e download.

## Sviluppo

```powershell
pnpm install
pnpm run build
python -m py_compile main.py
.\package-win.ps1
```

## Licenza e riconoscimenti

ThemeDeck è stato creato da [BrenticusMaximus](https://github.com/BrenticusMaximus). Questo fork per Windows è mantenuto da [LoZazaMastro](https://github.com/LoZazaMastro) e conserva la licenza originale [BSD 3-Clause](LICENSE). Dipendenze e binari inclusi sono documentati in [NOTICE](NOTICE) e [FFMPEG-README.txt](FFMPEG-README.txt).

<div align="center">

Fork per Windows creato e mantenuto da **[LoZazaMastro](https://github.com/LoZazaMastro)**.

</div>
