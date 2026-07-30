import { useMemo, useState } from "react";
import { Download, RotateCcw, Sparkles } from "lucide-react";
import { CopyButton } from "../components/CopyButton";
import { DownloadButton } from "../components/DownloadButton";
import { OptionField } from "../components/OptionField";
import { TextField } from "../components/TextWorkspace";
import { ToolActions } from "../components/ToolActions";
import { ValidationMessage } from "../components/ValidationMessage";
import { generateRandomNumbers, passwordEntropyBits, prepareRandomList, secureRandomInt, secureRandomString, secureShuffle, uniqueCharacters, type RandomSort, } from "../lib/public-tools/random";
type Mode = "number" | "string" | "password" | "list" | "dice" | "coin";
const lowercaseLetters = "abcdefghijklmnopqrstuvwxyz";
const uppercaseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const digits = "0123456789";
const symbols = "!@#$%^&*()-_=+[]{}";
const ambiguous = /[0O1Il|`'"]/gu;
const MODES: Array<{
    value: Mode;
    label: string;
}> = [
    { value: "number", label: "Numbers" },
    { value: "string", label: "Strings" },
    { value: "password", label: "Passwords" },
    { value: "list", label: "List picker" },
    { value: "dice", label: "Dice" },
    { value: "coin", label: "Coins" },
];
function validateCount(value: number, label = "Quantity") {
    if (!Number.isInteger(value) || value < 1 || value > 100) {
        throw new Error(`${label} must be between 1 and 100.`);
    }
}
function buildPassword(length: number, groups: string[]): string {
    const availableGroups = groups
        .map(uniqueCharacters)
        .filter((group) => group.length > 0);
    if (!availableGroups.length) {
        throw new Error("Choose at least one character group.");
    }
    if (!Number.isInteger(length) ||
        length < availableGroups.length ||
        length > 4096) {
        throw new Error(`Password length must be between ${availableGroups.length} and 4,096.`);
    }
    const required = availableGroups.map((group) => group[secureRandomInt(0, group.length - 1)]);
    const alphabet = uniqueCharacters(availableGroups.join(""));
    const remainingLength = length - required.length;
    const remaining = remainingLength
        ? secureRandomString(remainingLength, alphabet)
        : "";
    return secureShuffle([...required, ...remaining]).join("");
}
function formatEntropy(bits: number) {
    if (bits < 50)
        return `${Math.round(bits)} bits · limited`;
    if (bits < 80)
        return `${Math.round(bits)} bits · moderate`;
    if (bits < 120)
        return `${Math.round(bits)} bits · strong`;
    return `${Math.round(bits)} bits · very strong`;
}
export function RandomGeneratorTool() {
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
    const [error, setError] = useState("");
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
    const preparedList = prepareRandomList(list, removeDuplicates, caseSensitiveItems);
    const resultText = result.join("\n");
    const clearResult = () => {
        setResult([]);
        setSummary("");
        setError("");
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
                });
                nextSummary = `${nextResult.length} ${decimalPlaces ? "decimal" : "integer"} value${nextResult.length === 1 ? "" : "s"}${uniqueNumbers ? " without repeats" : ""}.`;
            }
            else if (mode === "string") {
                validateCount(quantity);
                if (!Number.isInteger(length) || length < 1 || length > 4096) {
                    throw new Error("String length must be between 1 and 4,096.");
                }
                if (activeStringAlphabet.length < 2) {
                    throw new Error("Choose at least two different characters.");
                }
                nextResult = Array.from({ length: quantity }, () => secureRandomString(length, activeStringAlphabet));
                nextSummary = `${quantity} string${quantity === 1 ? "" : "s"} using ${activeStringAlphabet.length.toLocaleString()} possible characters.`;
            }
            else if (mode === "password") {
                validateCount(quantity);
                nextResult = Array.from({ length: quantity }, () => buildPassword(length, selectedGroups));
                nextSummary = `${quantity} password${quantity === 1 ? "" : "s"} · ${formatEntropy(entropy)} estimated entropy each.`;
            }
            else if (mode === "dice") {
                validateCount(diceCount, "Number of dice");
                if (!Number.isInteger(diceSides) ||
                    diceSides < 2 ||
                    diceSides > 1000000) {
                    throw new Error("Dice sides must be between 2 and 1,000,000.");
                }
                const rolls = Array.from({ length: diceCount }, () => secureRandomInt(1, diceSides));
                nextResult = rolls.map(String);
                const total = rolls.reduce((sum, value) => sum + value, 0);
                nextSummary = `${diceCount}d${diceSides} · total ${total} · range ${Math.min(...rolls)}–${Math.max(...rolls)}.`;
            }
            else if (mode === "coin") {
                validateCount(coinCount, "Number of flips");
                nextResult = Array.from({ length: coinCount }, () => secureRandomInt(0, 1) === 0 ? "Heads" : "Tails");
                const heads = nextResult.filter((value) => value === "Heads").length;
                nextSummary = `${heads} heads · ${coinCount - heads} tails · ${coinCount} flip${coinCount === 1 ? "" : "s"}.`;
            }
            else {
                if (!preparedList.length) {
                    throw new Error("Enter at least one list item.");
                }
                const shuffled = secureShuffle(preparedList);
                if (listAction === "pick") {
                    validateCount(pickCount, "Items to pick");
                    if (pickCount > preparedList.length) {
                        throw new Error(`Only ${preparedList.length} available item${preparedList.length === 1 ? "" : "s"} can be picked without repeats.`);
                    }
                    nextResult = shuffled.slice(0, pickCount);
                    nextSummary = `Picked ${pickCount} of ${preparedList.length} available items without repeats.`;
                }
                else {
                    nextResult = shuffled;
                    nextSummary = `Shuffled all ${preparedList.length} available items.`;
                }
            }
            setResult(nextResult);
            setSummary(nextSummary);
            setError("");
        }
        catch (reason) {
            setError(reason instanceof Error
                ? reason.message
                : "Check the settings and try again.");
        }
    };
    const characterOptions = (<div className="checkbox-row" aria-label="Character groups">
      <label className="checkbox-field">
        <input type="checkbox" checked={includeLowercase} onChange={(event) => setIncludeLowercase(event.target.checked)}/>
        Lowercase
      </label>
      <label className="checkbox-field">
        <input type="checkbox" checked={includeUppercase} onChange={(event) => setIncludeUppercase(event.target.checked)}/>
        Uppercase
      </label>
      <label className="checkbox-field">
        <input type="checkbox" checked={includeNumbers} onChange={(event) => setIncludeNumbers(event.target.checked)}/>
        Numbers
      </label>
      {mode === "password" ? (<label className="checkbox-field">
          <input type="checkbox" checked={includeSymbols} onChange={(event) => setIncludeSymbols(event.target.checked)}/>
          Symbols
        </label>) : null}
      <label className="checkbox-field">
        <input type="checkbox" checked={excludeAmbiguous} onChange={(event) => setExcludeAmbiguous(event.target.checked)}/>
        Exclude ambiguous characters
      </label>
    </div>);
    return (<div className="random-workbench">
      <div className="mode-grid" role="tablist" aria-label="Random generator mode">
        {MODES.map((item) => (<button type="button" role="tab" aria-selected={mode === item.value} className={mode === item.value ? "active" : ""} key={item.value} onClick={() => {
                setMode(item.value);
                clearResult();
            }}>
            {item.label}
          </button>))}
      </div>

      <section className="random-settings-panel">
        <div className="random-section-heading">
          <div>
            <p className="eyebrow">Settings</p>
            <h2>{MODES.find((item) => item.value === mode)?.label}</h2>
          </div>
          <Sparkles aria-hidden="true"/>
        </div>

        {mode === "number" ? (<>
            <div className="option-row">
              <OptionField label="Minimum" htmlFor="random-min">
                <input id="random-min" type="number" step="any" value={min} onChange={(event) => setMin(Number(event.target.value))}/>
              </OptionField>
              <OptionField label="Maximum" htmlFor="random-max">
                <input id="random-max" type="number" step="any" value={max} onChange={(event) => setMax(Number(event.target.value))}/>
              </OptionField>
              <OptionField label="How many" htmlFor="random-quantity">
                <input id="random-quantity" type="number" min="1" max="100" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}/>
              </OptionField>
              <OptionField label="Decimal places" htmlFor="random-decimals">
                <select id="random-decimals" value={decimalPlaces} onChange={(event) => setDecimalPlaces(Number(event.target.value))}>
                  {[0, 1, 2, 3, 4, 5, 6].map((value) => (<option value={value} key={value}>
                      {value === 0 ? "Integers" : value}
                    </option>))}
                </select>
              </OptionField>
              <OptionField label="Result order" htmlFor="random-sort">
                <select id="random-sort" value={numberSort} onChange={(event) => setNumberSort(event.target.value as RandomSort)}>
                  <option value="generated">Generated order</option>
                  <option value="ascending">Lowest first</option>
                  <option value="descending">Highest first</option>
                </select>
              </OptionField>
            </div>
            <label className="checkbox-field random-inline-check">
              <input type="checkbox" checked={uniqueNumbers} onChange={(event) => setUniqueNumbers(event.target.checked)}/>
              Do not repeat values
            </label>
          </>) : null}

        {mode === "string" || mode === "password" ? (<>
            <div className="option-row">
              <OptionField label="Length" htmlFor="random-length">
                <input id="random-length" type="number" min={mode === "password" ? selectedGroups.length || 1 : 1} max="4096" value={length} onChange={(event) => setLength(Number(event.target.value))}/>
              </OptionField>
              <OptionField label="How many" htmlFor="random-string-quantity">
                <input id="random-string-quantity" type="number" min="1" max="100" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}/>
              </OptionField>
            </div>
            {characterOptions}
            {mode === "string" ? (<label className="random-custom-alphabet">
                Custom characters (optional)
                <input value={customAlphabet} onChange={(event) => setCustomAlphabet(event.target.value)} placeholder="Overrides the selected character groups" spellCheck={false}/>
                <small>
                  {activeStringAlphabet.length.toLocaleString()} unique
                  characters available
                </small>
              </label>) : (<div className="random-entropy" aria-label="Password strength estimate">
                <span style={{ width: `${Math.min(100, (entropy / 128) * 100)}%` }}/>
                <strong>{formatEntropy(entropy)}</strong>
                <small>
                  Mathematical estimate based on length and the selected
                  alphabet. It does not assess how a password is stored.
                </small>
              </div>)}
          </>) : null}

        {mode === "list" ? (<>
            <TextField id="random-list" label="List items, one per line" value={list} onChange={setList} rows={9}/>
            <div className="random-list-stats">
              {preparedList.length.toLocaleString()} available items
            </div>
            <div className="option-row">
              <OptionField label="List action" htmlFor="list-action">
                <select id="list-action" value={listAction} onChange={(event) => setListAction(event.target.value as "pick" | "shuffle")}>
                  <option value="pick">Pick without repeats</option>
                  <option value="shuffle">Shuffle all items</option>
                </select>
              </OptionField>
              {listAction === "pick" ? (<OptionField label="Items to pick" htmlFor="pick-count">
                  <input id="pick-count" type="number" min="1" max="100" value={pickCount} onChange={(event) => setPickCount(Number(event.target.value))}/>
                </OptionField>) : null}
            </div>
            <div className="checkbox-row">
              <label className="checkbox-field">
                <input type="checkbox" checked={removeDuplicates} onChange={(event) => setRemoveDuplicates(event.target.checked)}/>
                Remove duplicate items
              </label>
              <label className="checkbox-field">
                <input type="checkbox" checked={caseSensitiveItems} disabled={!removeDuplicates} onChange={(event) => setCaseSensitiveItems(event.target.checked)}/>
                Treat letter case as different
              </label>
            </div>
          </>) : null}

        {mode === "dice" ? (<>
            <div className="random-presets" aria-label="Common dice">
              {[4, 6, 8, 10, 12, 20, 100].map((sides) => (<button type="button" className={diceSides === sides ? "active" : ""} onClick={() => setDiceSides(sides)} key={sides}>
                  d{sides}
                </button>))}
            </div>
            <div className="option-row">
              <OptionField label="Number of dice" htmlFor="dice-count">
                <input id="dice-count" type="number" min="1" max="100" value={diceCount} onChange={(event) => setDiceCount(Number(event.target.value))}/>
              </OptionField>
              <OptionField label="Sides per die" htmlFor="dice-sides">
                <input id="dice-sides" type="number" min="2" max="1000000" value={diceSides} onChange={(event) => setDiceSides(Number(event.target.value))}/>
              </OptionField>
            </div>
          </>) : null}

        {mode === "coin" ? (<OptionField label="Number of flips" htmlFor="coin-count">
            <input id="coin-count" type="number" min="1" max="100" value={coinCount} onChange={(event) => setCoinCount(Number(event.target.value))}/>
          </OptionField>) : null}

        <ToolActions>
          <button type="button" className="primary-button" onClick={generate}>
            Generate
          </button>
          <button type="button" className="secondary-button" onClick={clearResult} disabled={!result.length && !error}>
            <RotateCcw aria-hidden="true"/> Clear result
          </button>
        </ToolActions>
        {error ? <ValidationMessage type="error" message={error}/> : null}
      </section>

      <section className="random-output-panel">
        <div className="random-section-heading">
          <div>
            <p className="eyebrow">Result</p>
            <h2>{result.length ? "Generated values" : "Ready to generate"}</h2>
          </div>
          {result.length ? <span>{result.length}</span> : null}
        </div>
        <div className="random-result" aria-live="polite">
          {resultText || "Your result will appear here."}
        </div>
        {summary ? <p className="random-summary">{summary}</p> : null}
        <ToolActions>
          <CopyButton text={resultText} toolSlug="random-generator">
            Copy results
          </CopyButton>
          <DownloadButton content={resultText ? `${resultText}\n` : ""} filename={`random-${mode}-results.txt`} toolSlug="random-generator">
            <Download aria-hidden="true"/> Download .txt
          </DownloadButton>
        </ToolActions>
      </section>

      <p className="tool-note random-guidance">
        {mode === "password"
            ? "Every password contains at least one character from each selected group. Store generated passwords in a trusted password manager."
            : mode === "dice" || mode === "coin"
                ? "Dice and coin modes are casual utilities and are not intended for regulated or high-stakes decisions."
                : "Values are generated with the browser’s cryptographic random source."}
      </p>
    </div>);
}
