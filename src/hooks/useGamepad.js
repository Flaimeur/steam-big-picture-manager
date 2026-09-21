import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook de navigation à la manette (Gamepad API).
 * Supporte Xbox, PlayStation (DualShock / DualSense), Nintendo Switch Pro Controller & Steam Deck.
 */
export function useGamepad({
  onNavigate,
  onButtonA,
  onButtonB,
  onButtonX,
  onButtonY,
  onButtonLB,
  onButtonRB,
  onButtonStart,
  onButtonSelect,
  enabled = true,
}) {
  const [hasGamepad, setHasGamepad] = useState(false);
  const [isGamepadMode, setIsGamepadMode] = useState(false);
  const [gamepadName, setGamepadName] = useState('');

  // Stocker les callbacks dans des refs pour éviter de recréer l'animation loop
  const callbacksRef = useRef({
    onNavigate,
    onButtonA,
    onButtonB,
    onButtonX,
    onButtonY,
    onButtonLB,
    onButtonRB,
    onButtonStart,
    onButtonSelect,
  });

  useEffect(() => {
    callbacksRef.current = {
      onNavigate,
      onButtonA,
      onButtonB,
      onButtonX,
      onButtonY,
      onButtonLB,
      onButtonRB,
      onButtonStart,
      onButtonSelect,
    };
  }, [
    onNavigate,
    onButtonA,
    onButtonB,
    onButtonX,
    onButtonY,
    onButtonLB,
    onButtonRB,
    onButtonStart,
    onButtonSelect,
  ]);

  const prevButtonsState = useRef({});
  const lastRepeatTime = useRef({ up: 0, down: 0, left: 0, right: 0 });
  const repeatDelay = useRef({ up: 0, down: 0, left: 0, right: 0 });

  // Détection des événements de connexion
  useEffect(() => {
    const handleConnected = (e) => {
      setHasGamepad(true);
      setIsGamepadMode(true);
      setGamepadName(e.gamepad?.id || 'Gamepad');
    };

    const handleDisconnected = () => {
      const remaining = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
      if (remaining.length === 0) {
        setHasGamepad(false);
        setIsGamepadMode(false);
        setGamepadName('');
      } else {
        setGamepadName(remaining[0]?.id || 'Gamepad');
      }
    };

    window.addEventListener('gamepadconnected', handleConnected);
    window.addEventListener('gamepaddisconnected', handleDisconnected);

    // Vérifier les manettes déjà connectées au montage
    if (navigator.getGamepads) {
      const initial = Array.from(navigator.getGamepads()).filter(Boolean);
      if (initial.length > 0) {
        setHasGamepad(true);
        setGamepadName(initial[0]?.id || 'Gamepad');
      }
    }

    // Basculer en mode souris si l'utilisateur bouge la souris
    const handleMouseMove = () => {
      // Ne désactive pas hasGamepad, mais indique que l'utilisateur est à la souris
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('gamepadconnected', handleConnected);
      window.removeEventListener('gamepaddisconnected', handleDisconnected);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Boucle de polling 60fps
  useEffect(() => {
    if (!enabled) return;

    let animId;
    const DEADZONE = 0.45;
    const INITIAL_REPEAT_MS = 280;
    const CONTINUOUS_REPEAT_MS = 140;

    const pollGamepad = (time) => {
      if (!navigator.getGamepads) {
        animId = requestAnimationFrame(pollGamepad);
        return;
      }

      const gamepads = navigator.getGamepads();
      let activeGamepad = null;
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i] && gamepads[i].connected) {
          activeGamepad = gamepads[i];
          break;
        }
      }

      if (!activeGamepad) {
        animId = requestAnimationFrame(pollGamepad);
        return;
      }

      if (!hasGamepad) {
        setHasGamepad(true);
      }

      const { buttons, axes } = activeGamepad;
      const cb = callbacksRef.current;

      // Helper vérification bouton appuyé avec déclenchement unique
      const checkButton = (index, callback) => {
        const isPressed = buttons[index] && (buttons[index].pressed || buttons[index].value > 0.5);
        const wasPressed = prevButtonsState.current[index];
        if (isPressed && !wasPressed) {
          setIsGamepadMode(true);
          if (callback) callback();
        }
        prevButtonsState.current[index] = isPressed;
      };

      // Mappage des boutons standard (W3C Gamepad Standard Mapping)
      // 0: A (Xbox) / Cross (PlayStation) / B (Nintendo)
      // 1: B (Xbox) / Circle (PlayStation) / A (Nintendo)
      // 2: X (Xbox) / Square (PlayStation) / Y (Nintendo)
      // 3: Y (Xbox) / Triangle (PlayStation) / X (Nintendo)
      // 4: LB / L1
      // 5: RB / R1
      // 8: Back / Select / Share
      // 9: Start / Options / Menu
      // 12: D-pad Haut
      // 13: D-pad Bas
      // 14: D-pad Gauche
      // 15: D-pad Droite
      checkButton(0, cb.onButtonA);
      checkButton(1, cb.onButtonB);
      checkButton(2, cb.onButtonX);
      checkButton(3, cb.onButtonY);
      checkButton(4, cb.onButtonLB);
      checkButton(5, cb.onButtonRB);
      checkButton(8, cb.onButtonSelect);
      checkButton(9, cb.onButtonStart);

      // Traitement des directions (D-pad ou Sticks)
      const dpadUp = buttons[12] && (buttons[12].pressed || buttons[12].value > 0.5);
      const dpadDown = buttons[13] && (buttons[13].pressed || buttons[13].value > 0.5);
      const dpadLeft = buttons[14] && (buttons[14].pressed || buttons[14].value > 0.5);
      const dpadRight = buttons[15] && (buttons[15].pressed || buttons[15].value > 0.5);

      const stickX = axes[0] || 0;
      const stickY = axes[1] || 0;

      const isUp = dpadUp || stickY < -DEADZONE;
      const isDown = dpadDown || stickY > DEADZONE;
      const isLeft = dpadLeft || stickX < -DEADZONE;
      const isRight = dpadRight || stickX > DEADZONE;

      const handleDirection = (dir, active) => {
        if (active) {
          setIsGamepadMode(true);
          const now = performance.now();
          const last = lastRepeatTime.current[dir];
          const delay = repeatDelay.current[dir];

          if (last === 0) {
            // Premier appui instantané
            lastRepeatTime.current[dir] = now;
            repeatDelay.current[dir] = INITIAL_REPEAT_MS;
            if (cb.onNavigate) cb.onNavigate(dir);
          } else if (now - last >= delay) {
            lastRepeatTime.current[dir] = now;
            repeatDelay.current[dir] = CONTINUOUS_REPEAT_MS;
            if (cb.onNavigate) cb.onNavigate(dir);
          }
        } else {
          lastRepeatTime.current[dir] = 0;
          repeatDelay.current[dir] = 0;
        }
      };

      handleDirection('up', isUp);
      handleDirection('down', isDown);
      handleDirection('left', isLeft);
      handleDirection('right', isRight);

      animId = requestAnimationFrame(pollGamepad);
    };

    animId = requestAnimationFrame(pollGamepad);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [enabled, hasGamepad]);

  return {
    hasGamepad,
    isGamepadMode,
    setIsGamepadMode,
    gamepadName,
  };
}
