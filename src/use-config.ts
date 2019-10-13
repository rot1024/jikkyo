import { useMemo } from "react";
import { useLocalStorage } from "react-use";

import { Settings, defaultSettings } from "./components/SettingPanel";

const regexp = (p?: string) => {
  if (!p) return undefined;
  try {
    return new RegExp(p);
  } catch (e) {
    return undefined;
  }
};

export default function useConfig() {
  const [settings, updateSettings] = useLocalStorage<Settings>(
    "jikkyo_settings",
    defaultSettings
  );

  const styles = useMemo(
    () => ({
      duration: settings.commentDuration,
      ueshitaDuration: settings.ueShitaCommentDuration,
      fontSize: settings.fontSize,
      rows: settings.rows,
      sizing: settings.sizeCalcMethod
      // fontFamily: settings.fontFamily,
      // fontWeight: settings.fontWeight,
      // lineHeight: settings.lineHeight,
      // bigSizeScale: settings.bigSizeScale,
      // smallSizeScale: settings.smallSizeScale,
    }),
    [
      settings.commentDuration,
      settings.fontSize,
      settings.rows,
      settings.sizeCalcMethod,
      settings.ueShitaCommentDuration
    ]
  );
  const thinning = useMemo<[number, number] | undefined>(() => {
    if (!settings.devision) return undefined;
    const denominator = parseInt(settings.devision, 10);
    if (isNaN(denominator) || denominator === 1) return undefined;
    const numeratorStr =
      denominator === 2
        ? settings.devision2 || "1"
        : denominator === 3
        ? settings.devision3 || "1"
        : denominator === 5
        ? settings.devision5 || "1"
        : denominator === 10
        ? settings.devision10 || "1"
        : undefined;
    if (!numeratorStr) return undefined;
    const numerator = parseInt(numeratorStr, 10);
    if (isNaN(numerator)) return undefined;
    return [numerator, denominator];
  }, [
    settings.devision,
    settings.devision10,
    settings.devision2,
    settings.devision3,
    settings.devision5
  ]);
  const muteKeywords = useMemo(() => regexp(settings.muteKeywords), [
    settings.muteKeywords
  ]);
  const filterKeywords = useMemo(() => regexp(settings.filterKeywords), [
    settings.filterKeywords
  ]);

  return {
    styles,
    thinning,
    muteKeywords,
    filterKeywords,
    settings,
    updateSettings
  };
}
