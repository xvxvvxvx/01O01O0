/* Developer-only helper (localhost / 127.0.0.1 / [::1] / file: only, re-checked on every call; the loader never fetches this file elsewhere). */
(()=>{if(typeof window==='undefined'||typeof DEVENV!=='function'||!DEVENV())return;
window.pirateShipNext=()=>{if(!DEVENV())return false;const g=Games.aviamasters;return !!(g&&g.armShip&&g.armShip())}})();
