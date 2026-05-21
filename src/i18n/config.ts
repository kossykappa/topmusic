import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const savedLanguage = localStorage.getItem('topmusic_language') || 'en';

const resources = {
  en: {
    translation: {
      feed: 'Feed',
      live: 'Live',
      artists: 'Artists',
      upload: 'Upload',
      coins: 'Coins',
      profile: 'Profile',
      logout: 'Logout',
      gifts: 'Gifts',
      discover: 'Discover',
      notifications: 'Notifications',
      earnings: 'Earnings',
      inbox: 'Inbox',

      publishMusicTopMusic: 'Publish music on TopMusic',
      uploadSubtitle:
        'Publish songs or videos, create automatic live licenses and prepare fair monetization.',
      data: 'Data',
      files: 'Files',
      publish: 'Publish',
      enterFeed: 'Enter the feed',
      enterFeedText: 'Your music becomes available for public discovery.',
      liveLicense: 'Live license',
      liveLicenseText: 'The artist sets the price for using the music in lives.',
      audioOrVideo: 'Audio or video',
      audioOrVideoText: 'Supports songs, music videos and live sessions.',
      musicTitle: 'Music title',
      artistName: 'Artist name',
      selectGenre: 'Select genre',
      selectLanguage: 'Select language',
      liveLicensePrice: 'Live license price (€)',
      back: 'Back',
      continue: 'Continue',
      publishing: 'Publishing...',
      publishTopMusic: 'Publish on TopMusic',
      audioVideoFile: 'Audio or video file',
      cover: 'Cover',
      reviewPublication: 'Review publication',
      title: 'Title',
      artist: 'Artist',
      genre: 'Genre',
      language: 'Language',
      file: 'File',

      fillMusicTitle: 'Fill in the music title.',
      fillArtistName: 'Fill in the artist name.',
      selectGenreError: 'Select the music genre.',
      selectLanguageError: 'Select the language.',
      selectMediaAndCover: 'Select the music/video file and the cover.',
      invalidFile: 'Invalid file.',
      artistCheckError: 'Error checking artist',
      artistCreateError: 'Error creating artist',
      unknown: 'unknown',
      uploadingCover: 'Uploading cover...',
      uploadingVideo: 'Uploading video...',
      uploadingAudio: 'Uploading audio...',
      coverUploadError: 'Cover upload failed',
      mediaUploadError: 'Media upload failed',
      preparingArtist: 'Preparing artist...',
      savingMusic: 'Saving music...',
      saveMusicError: 'Error saving music.',
      creatingLiveLicense: 'Creating live license...',
      createLicenseError: 'Error creating license',
      uploadFailed: 'Upload failed.',
      musicPublishedSuccess: 'Music published successfully',
      musicCanAppearFeed: 'The music can now appear in the TopMusic feed.',
    },
  },

  pt: {
    translation: {
      feed: 'Feed',
      live: 'Ao Vivo',
      artists: 'Artistas',
      upload: 'Upload',
      coins: 'Moedas',
      profile: 'Perfil',
      logout: 'Sair',
      gifts: 'Presentes',
      discover: 'Descobrir',
      notifications: 'Notificações',
      earnings: 'Ganhos',
      inbox: 'Inbox',

      publishMusicTopMusic: 'Publicar música no TopMusic',
      uploadSubtitle:
        'Publica músicas ou vídeos, cria licença automática para lives e prepara a monetização justa.',
      data: 'Dados',
      files: 'Ficheiros',
      publish: 'Publicar',
      enterFeed: 'Entra no feed',
      enterFeedText: 'A música fica disponível para descoberta pública.',
      liveLicense: 'Licença de live',
      liveLicenseText: 'O artista define valor para uso da música em lives.',
      audioOrVideo: 'Áudio ou vídeo',
      audioOrVideoText: 'Suporta músicas, videoclipes e sessões ao vivo.',
      musicTitle: 'Título da música',
      artistName: 'Nome do artista',
      selectGenre: 'Seleccionar género',
      selectLanguage: 'Seleccionar idioma',
      liveLicensePrice: 'Preço licença live (€)',
      back: 'Voltar',
      continue: 'Continuar',
      publishing: 'A publicar...',
      publishTopMusic: 'Publicar no TopMusic',
      audioVideoFile: 'Ficheiro áudio ou vídeo',
      cover: 'Capa',
      reviewPublication: 'Rever publicação',
      title: 'Título',
      artist: 'Artista',
      genre: 'Género',
      language: 'Idioma',
      file: 'Ficheiro',

      fillMusicTitle: 'Preencha o título da música.',
      fillArtistName: 'Preencha o nome do artista.',
      selectGenreError: 'Seleccione o género musical.',
      selectLanguageError: 'Seleccione o idioma.',
      selectMediaAndCover: 'Seleccione o ficheiro de música/vídeo e a capa.',
      invalidFile: 'Ficheiro inválido.',
      artistCheckError: 'Erro ao verificar artista',
      artistCreateError: 'Erro ao criar artista',
      unknown: 'desconhecido',
      uploadingCover: 'A carregar capa...',
      uploadingVideo: 'A carregar vídeo...',
      uploadingAudio: 'A carregar áudio...',
      coverUploadError: 'Falha no upload da capa',
      mediaUploadError: 'Falha no upload do ficheiro',
      preparingArtist: 'A preparar artista...',
      savingMusic: 'A guardar música...',
      saveMusicError: 'Erro ao guardar música.',
      creatingLiveLicense: 'A criar licença de live...',
      createLicenseError: 'Erro ao criar licença',
      uploadFailed: 'Falha no upload.',
      musicPublishedSuccess: 'Música publicada com sucesso',
      musicCanAppearFeed: 'A música já pode aparecer no feed TopMusic.',
    },
  },

  fr: {
    translation: {
      feed: 'Flux',
      live: 'Live',
      artists: 'Artistes',
      upload: 'Téléverser',
      coins: 'Pièces',
      profile: 'Profil',
      logout: 'Déconnexion',
      gifts: 'Cadeaux',
      discover: 'Découvrir',
      notifications: 'Notifications',
      earnings: 'Revenus',
      inbox: 'Boîte',

      publishMusicTopMusic: 'Publier une musique sur TopMusic',
      uploadSubtitle:
        'Publiez des chansons ou vidéos, créez des licences live automatiques et préparez une monétisation équitable.',
      data: 'Données',
      files: 'Fichiers',
      publish: 'Publier',
      enterFeed: 'Entrer dans le flux',
      enterFeedText: 'La musique devient disponible pour la découverte publique.',
      liveLicense: 'Licence live',
      liveLicenseText: 'L’artiste définit le prix d’utilisation de la musique en live.',
      audioOrVideo: 'Audio ou vidéo',
      audioOrVideoText: 'Prend en charge chansons, clips vidéo et sessions live.',
      musicTitle: 'Titre de la musique',
      artistName: 'Nom de l’artiste',
      selectGenre: 'Sélectionner un genre',
      selectLanguage: 'Sélectionner une langue',
      liveLicensePrice: 'Prix licence live (€)',
      back: 'Retour',
      continue: 'Continuer',
      publishing: 'Publication...',
      publishTopMusic: 'Publier sur TopMusic',
      audioVideoFile: 'Fichier audio ou vidéo',
      cover: 'Pochette',
      reviewPublication: 'Vérifier la publication',
      title: 'Titre',
      artist: 'Artiste',
      genre: 'Genre',
      language: 'Langue',
      file: 'Fichier',

      fillMusicTitle: 'Remplissez le titre de la musique.',
      fillArtistName: 'Remplissez le nom de l’artiste.',
      selectGenreError: 'Sélectionnez le genre musical.',
      selectLanguageError: 'Sélectionnez la langue.',
      selectMediaAndCover: 'Sélectionnez le fichier musique/vidéo et la pochette.',
      invalidFile: 'Fichier invalide.',
      artistCheckError: 'Erreur lors de la vérification de l’artiste',
      artistCreateError: 'Erreur lors de la création de l’artiste',
      unknown: 'inconnu',
      uploadingCover: 'Téléversement de la pochette...',
      uploadingVideo: 'Téléversement de la vidéo...',
      uploadingAudio: 'Téléversement de l’audio...',
      coverUploadError: 'Échec du téléversement de la pochette',
      mediaUploadError: 'Échec du téléversement du fichier',
      preparingArtist: 'Préparation de l’artiste...',
      savingMusic: 'Enregistrement de la musique...',
      saveMusicError: 'Erreur lors de l’enregistrement de la musique.',
      creatingLiveLicense: 'Création de la licence live...',
      createLicenseError: 'Erreur lors de la création de la licence',
      uploadFailed: 'Échec du téléversement.',
      musicPublishedSuccess: 'Musique publiée avec succès',
      musicCanAppearFeed: 'La musique peut maintenant apparaître dans le flux TopMusic.',
    },
  },

  es: {
    translation: {
      feed: 'Feed',
      live: 'En Vivo',
      artists: 'Artistas',
      upload: 'Subir',
      coins: 'Monedas',
      profile: 'Perfil',
      logout: 'Cerrar sesión',
      gifts: 'Regalos',
      discover: 'Descubrir',
      notifications: 'Notificaciones',
      earnings: 'Ganancias',
      inbox: 'Inbox',

      publishMusicTopMusic: 'Publicar música en TopMusic',
      uploadSubtitle:
        'Publica canciones o vídeos, crea licencias automáticas para lives y prepara una monetización justa.',
      data: 'Datos',
      files: 'Archivos',
      publish: 'Publicar',
      enterFeed: 'Entrar al feed',
      enterFeedText: 'La música queda disponible para descubrimiento público.',
      liveLicense: 'Licencia live',
      liveLicenseText: 'El artista define el precio para usar la música en lives.',
      audioOrVideo: 'Audio o vídeo',
      audioOrVideoText: 'Soporta canciones, videoclips y sesiones en vivo.',
      musicTitle: 'Título de la música',
      artistName: 'Nombre del artista',
      selectGenre: 'Seleccionar género',
      selectLanguage: 'Seleccionar idioma',
      liveLicensePrice: 'Precio licencia live (€)',
      back: 'Volver',
      continue: 'Continuar',
      publishing: 'Publicando...',
      publishTopMusic: 'Publicar en TopMusic',
      audioVideoFile: 'Archivo de audio o vídeo',
      cover: 'Portada',
      reviewPublication: 'Revisar publicación',
      title: 'Título',
      artist: 'Artista',
      genre: 'Género',
      language: 'Idioma',
      file: 'Archivo',

      fillMusicTitle: 'Rellena el título de la música.',
      fillArtistName: 'Rellena el nombre del artista.',
      selectGenreError: 'Selecciona el género musical.',
      selectLanguageError: 'Selecciona el idioma.',
      selectMediaAndCover: 'Selecciona el archivo de música/vídeo y la portada.',
      invalidFile: 'Archivo inválido.',
      artistCheckError: 'Error al verificar artista',
      artistCreateError: 'Error al crear artista',
      unknown: 'desconocido',
      uploadingCover: 'Subiendo portada...',
      uploadingVideo: 'Subiendo vídeo...',
      uploadingAudio: 'Subiendo audio...',
      coverUploadError: 'Falló la subida de la portada',
      mediaUploadError: 'Falló la subida del archivo',
      preparingArtist: 'Preparando artista...',
      savingMusic: 'Guardando música...',
      saveMusicError: 'Error al guardar música.',
      creatingLiveLicense: 'Creando licencia live...',
      createLicenseError: 'Error al crear licencia',
      uploadFailed: 'Falló la subida.',
      musicPublishedSuccess: 'Música publicada con éxito',
      musicCanAppearFeed: 'La música ya puede aparecer en el feed TopMusic.',
    },
  },

  en: {
  translation: {
    feed: 'Feed',
    live: 'Live',
    artists: 'Artists',
    upload: 'Upload',
    coins: 'Coins',

    data: 'Data',
    files: 'Files',
    publish: 'Publish',

    publishMusicTopMusic: 'Publish music on TopMusic',

    uploadSubtitle:
      'Publish music or videos, create automatic live licences and prepare fair monetisation.',

    enterFeed: 'Appear in feed',
    enterFeedText:
      'Your music becomes available for public discovery.',

    liveLicense: 'Live licence',
    liveLicenseText:
      'The artist defines the price for using music during lives.',

    audioOrVideo: 'Audio or Video',
    audioOrVideoText:
      'Supports songs, music videos and live sessions.',

    musicTitle: 'Music title',
    artistName: 'Artist name',

    selectGenre: 'Select genre',
    selectLanguage: 'Select language',

    liveLicensePrice: 'Live licence price (€)',

    audioVideoFile: 'Audio or Video file',
    cover: 'Cover',

    reviewPublication: 'Review publication',

    title: 'Title',
    artist: 'Artist',
    genre: 'Genre',
    language: 'Language',
    file: 'File',

    back: 'Back',
    continue: 'Continue',

    publishing: 'Publishing...',
    publishTopMusic: 'Publish on TopMusic',

    musicPublishedSuccess:
      'Music published successfully',

    musicCanAppearFeed:
      'Your music can now appear in the public feed'
  }
}

pt: {
  translation: {
    data: 'Dados',
    files: 'Ficheiros',
    publish: 'Publicar',

    publishMusicTopMusic:
      'Publicar música no TopMusic',

    uploadSubtitle:
      'Publica músicas ou vídeos, cria licença automática para lives e prepara a monetização justa.',

    enterFeed: 'Entra no feed',

    enterFeedText:
      'A música fica disponível para descoberta pública.',

    liveLicense: 'Licença de live',

    liveLicenseText:
      'O artista define valor para uso da música em lives.',

    audioOrVideo: 'Áudio ou vídeo',

    audioOrVideoText:
      'Suporta músicas, videoclipes e sessões ao vivo.',

    musicTitle: 'Título da música',

    artistName: 'Nome do artista',

    selectGenre: 'Seleccionar género',

    selectLanguage: 'Seleccionar idioma',

    liveLicensePrice:
      'Preço da licença de live (€)',

    audioVideoFile: 'Ficheiro áudio ou vídeo',

    cover: 'Capa',

    reviewPublication:
      'Rever publicação',

    title: 'Título',

    artist: 'Artista',

    genre: 'Género',

    language: 'Idioma',

    file: 'Ficheiro',

    back: 'Voltar',

    continue: 'Continuar',

    publishing: 'A publicar...',

    publishTopMusic:
      'Publicar no TopMusic',

    musicPublishedSuccess:
      'Música publicada com sucesso',

    musicCanAppearFeed:
      'A sua música já pode aparecer no feed público'
  }
}

  nl: {
    translation: {
      feed: 'Feed',
      live: 'Live',
      artists: 'Artiesten',
      upload: 'Uploaden',
      coins: 'Munten',
      profile: 'Profiel',
      logout: 'Uitloggen',
      gifts: 'Cadeaus',
      discover: 'Ontdekken',
      notifications: 'Meldingen',
      earnings: 'Inkomsten',
      inbox: 'Inbox',

      publishMusicTopMusic: 'Muziek publiceren op TopMusic',
      uploadSubtitle:
        'Publiceer nummers of video’s, maak automatische live-licenties aan en bereid eerlijke monetisatie voor.',
      data: 'Gegevens',
      files: 'Bestanden',
      publish: 'Publiceren',
      enterFeed: 'In de feed plaatsen',
      enterFeedText: 'De muziek wordt beschikbaar voor publieke ontdekking.',
      liveLicense: 'Live-licentie',
      liveLicenseText: 'De artiest bepaalt de prijs voor gebruik van de muziek in lives.',
      audioOrVideo: 'Audio of video',
      audioOrVideoText: 'Ondersteunt nummers, videoclips en livesessies.',
      musicTitle: 'Muziektitel',
      artistName: 'Artiestennaam',
      selectGenre: 'Selecteer genre',
      selectLanguage: 'Selecteer taal',
      liveLicensePrice: 'Prijs live-licentie (€)',
      back: 'Terug',
      continue: 'Verder',
      publishing: 'Publiceren...',
      publishTopMusic: 'Publiceren op TopMusic',
      audioVideoFile: 'Audio- of videobestand',
      cover: 'Cover',
      reviewPublication: 'Publicatie controleren',
      title: 'Titel',
      artist: 'Artiest',
      genre: 'Genre',
      language: 'Taal',
      file: 'Bestand',

      fillMusicTitle: 'Vul de muziektitel in.',
      fillArtistName: 'Vul de artiestennaam in.',
      selectGenreError: 'Selecteer het muziekgenre.',
      selectLanguageError: 'Selecteer de taal.',
      selectMediaAndCover: 'Selecteer het muziek-/videobestand en de cover.',
      invalidFile: 'Ongeldig bestand.',
      artistCheckError: 'Fout bij controleren artiest',
      artistCreateError: 'Fout bij aanmaken artiest',
      unknown: 'onbekend',
      uploadingCover: 'Cover uploaden...',
      uploadingVideo: 'Video uploaden...',
      uploadingAudio: 'Audio uploaden...',
      coverUploadError: 'Uploaden van cover mislukt',
      mediaUploadError: 'Uploaden van bestand mislukt',
      preparingArtist: 'Artiest voorbereiden...',
      savingMusic: 'Muziek opslaan...',
      saveMusicError: 'Fout bij opslaan van muziek.',
      creatingLiveLicense: 'Live-licentie aanmaken...',
      createLicenseError: 'Fout bij aanmaken licentie',
      uploadFailed: 'Upload mislukt.',
      musicPublishedSuccess: 'Muziek succesvol gepubliceerd',
      musicCanAppearFeed: 'De muziek kan nu verschijnen in de TopMusic-feed.',
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;