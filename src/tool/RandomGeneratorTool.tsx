import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "use-intl";
import { Download, RotateCcw, Sparkles } from "lucide-react";
import { CopyButton } from "../components/CopyButton";
import { DownloadButton } from "../components/DownloadButton";
import { OptionField } from "../components/OptionField";
import { TextField } from "../components/TextWorkspace";
import { ToolActions } from "../components/ToolActions";
import { ValidationMessage } from "../components/ValidationMessage";
import { classifyRandomError } from "../lib/public-tools/randomErrors";
import { generateRandomNumbers, passwordEntropyBits, prepareRandomList, secureRandomInt, secureRandomString, secureShuffle, uniqueCharacters, type RandomSort, } from "../lib/public-tools/random";
type Mode = "number" | "string" | "password" | "list" | "dice" | "coin";
type LocalErrorKey = "count" | "characterGroup" | "passwordLength" | "stringLength" | "stringAlphabet" | "diceSides" | "emptyList" | "pickUnavailable";
type ErrorValues = Readonly<Record<string, string | number>>;
class RandomGeneratorError extends Error {
    constructor(public readonly key: LocalErrorKey, public readonly values: ErrorValues = {}) {
        super(key);
        this.name = "RandomGeneratorError";
    }
}
const lowercaseLetters = "abcdefghijklmnopqrstuvwxyz";
const uppercaseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const digits = "0123456789";
const symbols = "!@#$%^&*()-_=+[]{}";
const ambiguous = /[0O1Il|`'"]/gu;
const MODES: Mode[] = ["number", "string", "password", "list", "dice", "coin"];
function validateCount(value: number, label: string) {
    if (!Number.isInteger(value) || value < 1 || value > 100) {
        throw new RandomGeneratorError("count", { label });
    }
}
function buildPassword(length: number, groups: string[]): string {
    const availableGroups = groups
        .map(uniqueCharacters)
        .filter((group) => group.length > 0);
    if (!availableGroups.length) {
        throw new RandomGeneratorError("characterGroup");
    }
    if (!Number.isInteger(length) ||
        length < availableGroups.length ||
        length > 4096) {
        throw new RandomGeneratorError("passwordLength", {
            minimum: availableGroups.length,
        });
    }
    const required = availableGroups.map((group) => group[secureRandomInt(0, group.length - 1)]);
    const alphabet = uniqueCharacters(availableGroups.join(""));
    const remainingLength = length - required.length;
    const remaining = remainingLength
        ? secureRandomString(remainingLength, alphabet)
        : "";
    return secureShuffle([...required, ...remaining]).join("");
}
function entropyLevel(bits: number) {
    if (bits < 50)
        return "limited" as const;
    if (bits < 80)
        return "moderate" as const;
    if (bits < 120)
        return "strong" as const;
    return "veryStrong" as const;
}
export function RandomGeneratorTool() {
    const t = useTranslations("tools.utilities.random-generator.tool");
    const locale = useLocale();
    const [mode, setMode] = useState<Mode>("number");
    const [min, setMin] = useState(1);
    const [max, setMax] = useState(100);
    const [quantity, setQuantity] = useState(1);
    const [decimalPlaces, setDecimalPlaces] = useState(0);
    const [uniqueNumbers, setUniqueNumbers] = useState(false);
    const [numberSort, setNumberSort] = useState<RandomSort>("generated");
    const [length, setLength] = useState(16);
    const [includeLowercase, setIncludeLowercase] = useState(true);
    const [includeUppercase, setIncludeUppercase] = useState(true);
    const [includeNumbers, setIncludeNumbers] = useState(true);
    const [includeSymbols, setIncludeSymbols] = useState(true);
    const [excludeAmbiguous, setExcludeAmbiguous] = useState(true);
    const [customAlphabet, setCustomAlphabet] = useState("");
    const [list, setList] = useState("");
    const [listAction, setListAction] = useState<"pick" | "shuffle">("pick");
    const [pickCount, setPickCount] = useState(1);
    const [removeDuplicates, setRemoveDuplicates] = useState(true);
    const [caseSensitiveItems, setCaseSensitiveItems] = useState(false);
    const [diceSides, setDiceSides] = useState(6);
    const [diceCount, setDiceCount] = useState(1);
    const [coinCount, setCoinCount] = useState(1);
    const [result, setResult] = useState<string[]>([]);
    const [summary, setSummary] = useState("");
    const [error, setError] = useState<{
        key: string;
        values?: ErrorValues;
    } | null>(null);
    const selectedGroups = useMemo(() => {
        const groups = [
            includeLowercase ? lowercaseLetters : "",
            includeUppercase ? uppercaseLetters : "",
            includeNumbers ? digits : "",
            includeSymbols && mode === "password" ? symbols : "",
        ].filter(Boolean);
        return excludeAmbiguous
            ? groups.map((group) => group.replace(ambiguous, ""))
            : groups;
    }, [
        excludeAmbiguous,
        includeLowercase,
        includeNumbers,
        includeSymbols,
        includeUppercase,
        mode,
    ]);
    const generatedAlphabet = uniqueCharacters(selectedGroups.join(""));
    const activeStringAlphabet = uniqueCharacters(customAlphabet || generatedAlphabet);
    const entropy = passwordEntropyBits(length, generatedAlphabet.length);
    const entropyText = t(`settings.entropy.${entropyLevel(entropy)}`, {
        bits: Math.round(entropy),
    });
    const preparedList = prepareRandomList(list, removeDuplicates, caseSensitiveItems, locale);
    const resultText = result.join("\n");
    const clearResult = () => {
        setResult([]);
        setSummary("");
        setError(null);
    };
    const generate = () => {
        try {
            let nextResult: string[] = [];
            let nextSummary = "";
            if (mode === "number") {
                nextResult = generateRandomNumbers({
                    minimum: min,
                    maximum: max,
                    quantity,
                    decimalPlaces,
                    unique: uniqueNumbers,
                    sort: numberSort,
                    locale,
                });
                nextSummary = t("summary.number", {
                    count: nextResult.length,
                    kind: t(decimalPlaces ? "summary.decimal" : "summary.integer"),
                    unique: String(uniqueNumbers),
                });
            }
            else if (mode === "string") {
                validateCount(quantity, t("errors.quantity"));
                if (!Number.isInteger(length) || length < 1 || length > 4096) {
                    throw new RandomGeneratorError("stringLength");
                }
                if (activeStringAlphabet.length < 2) {
                    throw new RandomGeneratorError("stringAlphabet");
                }
                nextResult = Array.from({ length: quantity }, () => secureRandomString(length, activeStringAlphabet));
                nextSummary = t("summary.string", {
                    count: quantity,
                    characters: activeStringAlphabet.length,
                });
            }
            else if (mode === "password") {
                validateCount(quantity, t("errors.quantity"));
                nextResult = Array.from({ length: quantity }, () => buildPassword(length, selectedGroups));
                nextSummary = t("summary.password", {
                    count: quantity,
                    entropy: entropyText,
                });
            }
            else if (mode === "dice") {
                validateCount(diceCount, t("errors.diceCount"));
                if (!Number.isInteger(diceSides) ||
                    diceSides < 2 ||
                    diceSides > 1000000) {
                    throw new RandomGeneratorError("diceSides");
                }
                const rolls = Array.from({ length: diceCount }, () => secureRandomInt(1, diceSides));
                nextResult = rolls.map(String);
                const total = rolls.reduce((sum, value) => sum + value, 0);
                nextSummary = t("summary.dice", {
                    notation: `${diceCount}d${diceSides}`,
                    total,
                    minimum: Math.min(...rolls),
                    maximum: Math.max(...rolls),
                });
            }
            else if (mode === "coin") {
                validateCount(coinCount, t("errors.coinCount"));
                nextResult = Array.from({ length: coinCount }, () => secureRandomInt(0, 1) === 0 ? t("coin.heads") : t("coin.tails"));
                const heads = nextResult.filter((value) => value === t("coin.heads")).length;
                nextSummary = t("summary.coin", {
                    heads,
                    tails: coinCount - heads,
                    count: coinCount,
                });
            }
            else {
                if (!preparedList.length) {
                    throw new RandomGeneratorError("emptyList");
                }
                const shuffled = secureShuffle(preparedList);
                if (listAction === "pick") {
                    validateCount(pickCount, t("errors.pickCount"));
                    if (pickCount > preparedList.length) {
                        throw new RandomGeneratorError("pickUnavailable", {
                            available: preparedList.length,
                        });
                    }
                    nextResult = shuffled.slice(0, pickCount);
                    nextSummary = t("summary.picked", {
                        picked: pickCount,
                        available: preparedList.length,
                    });
                }
                else {
                    nextResult = shuffled;
                    nextSummary = t("summary.shuffled", { count: preparedList.length });
                }
            }
            setResult(nextResult);
            setSummary(nextSummary);
            setError(null);
        }
        catch (reason) {
            if (reason instanceof RandomGeneratorError) {
                setError({ key: reason.key, values: reason.values });
            }
            else {
                const classified = classifyRandomError(reason);
                setError({
                    key: classified.key,
                    values: classified.key === "count"
                        ? { ...classified.values, label: t("errors.quantity") }
                        : classified.values,
                });
            }
        }
    };
    const characterOptions = (<div className="checkbox-row" aria-label={t("settings.groupsAria")}>
      <label className="checkbox-field">
        <input type="checkbox" checked={includeLowercase} onChange={(event) => setIncludeLowercase(event.target.checked)}/>
        {t("settings.lowercase")}
      </label>
      <label className="checkbox-field">
        <input type="checkbox" checked={includeUppercase} onChange={(event) => setIncludeUppercase(event.target.checked)}/>
        {t("settings.uppercase")}
      </label>
      <label className="checkbox-field">
        <input type="checkbox" checked={includeNumbers} onChange={(event) => setIncludeNumbers(event.target.checked)}/>
        {t("settings.numbers")}
      </label>
      {mode === "password" ? (<label className="checkbox-field">
          <input type="checkbox" checked={includeSymbols} onChange={(event) => setIncludeSymbols(event.target.checked)}/>
          {t("settings.symbols")}
        </label>) : null}
      <label className="checkbox-field">
        <input type="checkbox" checked={excludeAmbiguous} onChange={(event) => setExcludeAmbiguous(event.target.checked)}/>
        {t("settings.excludeAmbiguous")}
      </label>
    </div>);
    return (<div className="random-workbench">
      <div className="mode-grid" role="tablist" aria-label={t("modesAria")}>
        {MODES.map((item) => (<button type="button" role="tab" aria-selected={mode === item} className={mode === item ? "active" : ""} key={item} onClick={() => {
                setMode(item);
                clearResult();
            }}>
            {t(`modes.${item}`)}
          </button>))}
      </div>

      <section className="random-settings-panel">
        <div className="random-section-heading">
          <div>
            <p className="eyebrow">{t("settings.eyebrow")}</p>
            <h2>{t(`modes.${mode}`)}</h2>
          </div>
          <Sparkles aria-hidden="true"/>
        </div>

        {mode === "number" ? (<>
            <div className="option-row">
              <OptionField label={t("settings.minimum")} htmlFor="random-min">
                <input id="random-min" type="number" step="any" value={min} onChange={(event) => setMin(Number(event.target.value))}/>
              </OptionField>
              <OptionField label={t("settings.maximum")} htmlFor="random-max">
                <input id="random-max" type="number" step="any" value={max} onChange={(event) => setMax(Number(event.target.value))}/>
              </OptionField>
              <OptionField label={t("settings.howMany")} htmlFor="random-quantity">
                <input id="random-quantity" type="number" min="1" max="100" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}/>
              </OptionField>
              <OptionField label={t("settings.decimalPlaces")} htmlFor="random-decimals">
                <select id="random-decimals" value={decimalPlaces} onChange={(event) => setDecimalPlaces(Number(event.target.value))}>
                  {[0, 1, 2, 3, 4, 5, 6].map((value) => (<option value={value} key={value}>
                      {value === 0 ? t("settings.integers") : value}
                    </option>))}
                </select>
              </OptionField>
              <OptionField label={t("settings.resultOrder")} htmlFor="random-sort">
                <select id="random-sort" value={numberSort} onChange={(event) => setNumberSort(event.target.value as RandomSort)}>
                  <option value="generated">
                    {t("settings.generatedOrder")}
                  </option>
                  <option value="ascending">{t("settings.lowestFirst")}</option>
                  <option value="descending">
                    {t("settings.highestFirst")}
                  </option>
                </select>
              </OptionField>
            </div>
            <label className="checkbox-field random-inline-check">
              <input type="checkbox" checked={uniqueNumbers} onChange={(event) => setUniqueNumbers(event.target.checked)}/>
              {t("settings.noRepeats")}
            </label>
          </>) : null}

        {mode === "string" || mode === "password" ? (<>
            <div className="option-row">
              <OptionField label={t("settings.length")} htmlFor="random-length">
                <input id="random-length" type="number" min={mode === "password" ? selectedGroups.length || 1 : 1} max="4096" value={length} onChange={(event) => setLength(Number(event.target.value))}/>
              </OptionField>
              <OptionField label={t("settings.howMany")} htmlFor="random-string-quantity">
                <input id="random-string-quantity" type="number" min="1" max="100" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}/>
              </OptionField>
            </div>
            {characterOptions}
            {mode === "string" ? (<label className="random-custom-alphabet">
                {t("settings.customCharacters")}
                <input value={customAlphabet} onChange={(event) => setCustomAlphabet(event.target.value)} placeholder={t("settings.customPlaceholder")} spellCheck={false}/>
                <small>
                  {t("settings.uniqueCharacters", {
                    count: activeStringAlphabet.length,
                })}
                </small>
              </label>) : (<div className="random-entropy" aria-label={t("settings.strengthAria")}>
                <span style={{ width: `${Math.min(100, (entropy / 128) * 100)}%` }}/>
                <strong>{entropyText}</strong>
                <small>{t("settings.entropyHint")}</small>
              </div>)}
          </>) : null}

        {mode === "list" ? (<>
            <TextField id="random-list" label={t("settings.listItems")} value={list} onChange={setList} rows={9}/>
            <div className="random-list-stats">
              {t("settings.availableItems", { count: preparedList.length })}
            </div>
            <div className="option-row">
              <OptionField label={t("settings.listAction")} htmlFor="list-action">
                <select id="list-action" value={listAction} onChange={(event) => setListAction(event.target.value as "pick" | "shuffle")}>
                  <option value="pick">
                    {t("settings.pickWithoutRepeats")}
                  </option>
                  <option value="shuffle">{t("settings.shuffleAll")}</option>
                </select>
              </OptionField>
              {listAction === "pick" ? (<OptionField label={t("settings.itemsToPick")} htmlFor="pick-count">
                  <input id="pick-count" type="number" min="1" max="100" value={pickCount} onChange={(event) => setPickCount(Number(event.target.value))}/>
                </OptionField>) : null}
            </div>
            <div className="checkbox-row">
              <label className="checkbox-field">
                <input type="checkbox" checked={removeDuplicates} onChange={(event) => setRemoveDuplicates(event.target.checked)}/>
                {t("settings.removeDuplicates")}
              </label>
              <label className="checkbox-field">
                <input type="checkbox" checked={caseSensitiveItems} disabled={!removeDuplicates} onChange={(event) => setCaseSensitiveItems(event.target.checked)}/>
                {t("settings.caseSensitive")}
              </label>
            </div>
          </>) : null}

        {mode === "dice" ? (<>
            <div className="random-presets" aria-label={t("settings.commonDiceAria")}>
              {[4, 6, 8, 10, 12, 20, 100].map((sides) => (
            /* i18n-ignore -- conventional dice notation such as d6 and d20 */
            <button type="button" className={diceSides === sides ? "active" : ""} onClick={() => setDiceSides(sides)} key={sides}>
                  d{sides}
                </button>))}
            </div>
            <div className="option-row">
              <OptionField label={t("settings.diceCount")} htmlFor="dice-count">
                <input id="dice-count" type="number" min="1" max="100" value={diceCount} onChange={(event) => setDiceCount(Number(event.target.value))}/>
              </OptionField>
              <OptionField label={t("settings.diceSides")} htmlFor="dice-sides">
                <input id="dice-sides" type="number" min="2" max="1000000" value={diceSides} onChange={(event) => setDiceSides(Number(event.target.value))}/>
              </OptionField>
            </div>
          </>) : null}

        {mode === "coin" ? (<OptionField label={t("settings.coinCount")} htmlFor="coin-count">
            <input id="coin-count" type="number" min="1" max="100" value={coinCount} onChange={(event) => setCoinCount(Number(event.target.value))}/>
          </OptionField>) : null}

        <ToolActions>
          <button type="button" className="primary-button" onClick={generate}>
            {t("settings.generate")}
          </button>
          <button type="button" className="secondary-button" onClick={clearResult} disabled={!result.length && !error}>
            <RotateCcw aria-hidden="true"/> {t("settings.clear")}
          </button>
        </ToolActions>
        {error ? (<ValidationMessage type="error" message={t(`errors.${error.key}`, error.values)}/>) : null}
      </section>

      <section className="random-output-panel">
        <div className="random-section-heading">
          <div>
            <p className="eyebrow">{t("result.eyebrow")}</p>
            <h2>{result.length ? t("result.generated") : t("result.ready")}</h2>
          </div>
          {result.length ? <span>{result.length}</span> : null}
        </div>
        <div className="random-result" aria-live="polite">
          {resultText || t("result.empty")}
        </div>
        {summary ? <p className="random-summary">{summary}</p> : null}
        <ToolActions sticky>
          <CopyButton text={resultText} toolSlug="random-generator">
            {t("result.copy")}
          </CopyButton>
          <DownloadButton content={resultText ? `${resultText}\n` : ""} filename={t("result.filename", { mode })} toolSlug="random-generator">
            <Download aria-hidden="true"/> {t("result.download")}
          </DownloadButton>
        </ToolActions>
      </section>

      <p className="tool-note random-guidance">
        {mode === "password"
            ? t("guidance.password")
            : mode === "dice" || mode === "coin"
                ? t("guidance.chance")
                : t("guidance.random")}
      </p>
    </div>);
}
