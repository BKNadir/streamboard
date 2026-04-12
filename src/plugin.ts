import streamDeck from "@elgato/streamdeck";
import { PlaySoundAction } from "./actions/play-sound";
import { StopSoundAction } from "./actions/stop-sound";
import { Player } from "./actions/ffplay-player";


streamDeck.logger.setLevel("trace");

const playingSounds: Record<string, Player> = {};

streamDeck.actions.registerAction(new PlaySoundAction(playingSounds));
streamDeck.actions.registerAction(new StopSoundAction(playingSounds));

streamDeck.connect();