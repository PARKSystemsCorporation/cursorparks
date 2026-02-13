/**
 * Wallet card deployment. Replaces capsule deploy visuals.
 * Flow: card throw → hit ground → slide → mechanical unfold → creature assembles.
 * Event: parks-deploy-wallet-card { type, position, creatureId }
 * On complete: parks-spawn-creature { type, position, creatureId, identity }
 */

const WALLET_DEPLOY_EVENT = "parks-deploy-wallet-card";
const SPAWN_AFTER_DEPLOY_EVENT = "parks-spawn-creature";

function dispatchWalletDeploy(payload) {
  window.dispatchEvent(
    new CustomEvent(WALLET_DEPLOY_EVENT, { detail: payload })
  );
}

function dispatchSpawnAfterDeploy(payload) {
  window.dispatchEvent(
    new CustomEvent(SPAWN_AFTER_DEPLOY_EVENT, { detail: payload })
  );
}

module.exports = {
  WALLET_DEPLOY_EVENT,
  SPAWN_AFTER_DEPLOY_EVENT,
  dispatchWalletDeploy,
  dispatchSpawnAfterDeploy,
};
