import { Config } from "@remotion/cli/config";

Config.setEntryPoint("src/index.ts");
Config.setOverwriteOutput(true);

// Output quality, matched to the reference film (1080x1920, 30 fps, H.264 + AAC).
Config.setVideoImageFormat("png"); // lossless frames: no JPEG noise on flat colour and thin lines
Config.setCrf(14); // near-lossless H.264; a 40 s episode stays far below Instagram's size limit
Config.setAudioBitrate("192k");
Config.setColorSpace("bt709"); // same colour tagging as the reference, so players show identical colours
