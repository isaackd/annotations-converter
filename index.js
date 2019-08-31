const convertButton = document.getElementById("convert-button");
const youtubeFormat = document.getElementById("youtube-format");
const arFormat = document.getElementById("ar-format");

const fileInput = document.getElementById("file-input");
const jsonInput = document.getElementById("json-file");

document.getElementById("load-json-dump").addEventListener("click", e => {
	youtubeFormat.value = "*** Loading large JSON dumps requires lots of RAM";
	arFormat.value = "*** Loading large JSON dumps requires lots of RAM";
});

youtubeFormat.value = "";
arFormat.value = "";

const multiMessage = `*** Multiple files are only used for gathering data from large sets of XML annotation files.
*** There will be no output. Select a single file to convert.`

const youtubeFormatLength = document.getElementById("youtube-format-length");
const arFormatLength = document.getElementById("ar-format-length");

// track unique properties of converted data
const typeSet = new Set();
const styleSet = new Set();
const actionTypeSet = new Set();
const actionTriggerSet = new Set();
const regionTypeSet = new Set();
const triggerStateSet = new Set();

const uniqueTypes = document.getElementById("unique-types");
const uniqueStyles = document.getElementById("unique-styles");
const uniqueActionTypes = document.getElementById("unique-action-types");
const uniqueActionTriggers = document.getElementById("unique-action-triggers");
const uniqueRegionTypes = document.getElementById("unique-region-types");
const uniqueTriggerStates = document.getElementById("unique-trigger-states");

const parser = new AnnotationParser();
convertButton.addEventListener("click", e => {
	if (youtubeFormat.value) {
		const reader = new FileReader();
		if (fileInput.files.length > 1) {
			readFiles(fileInput.files, reader);
		}
		else {
			convertAnnotationData(youtubeFormat.value);
		}
	}
});

fileInput.value = "";
fileInput.addEventListener("change", async e => {
	youtubeFormat.value = "";
	arFormat.value = "";
	youtubeFormatLength.textContent = "";
	arFormatLength.textContent = "";
	const reader = new FileReader();
	const files = fileInput.files;
	if (files.length === 1) {
		youtubeFormat.value = await readFile(files[0], reader);
	}
	else if (files.length > 1) {
		youtubeFormat.value = multiMessage;
		arFormat.value = multiMessage;
	}
});

jsonInput.addEventListener("change", e => {
	const file = jsonInput.files[0];
	if (file) {
		const reader = new FileReader();
		let dataLength = 0;
		return new Promise(async (resolve, reject) => {
			try {
				const data = await readFile(file, reader);
				const jsonData = JSON.parse(data);

				const keys =  Object.keys(jsonData);
				for (let i = 0; i < 10; i++) {
					const xml = jsonData[keys[i]];
					dataLength += xml.length;
					convertAnnotationData(xml, false, false, false);
				}
			}
			catch(e) {
				throw e;
			}
			resolve();
			updateFormatLengths(true, dataLength, dataLength);
			updateUniqueAttributes();
		});
	}
});

async function readFiles(files) {

	const reader = new FileReader();
	let dataLength = 0;

	return new Promise(async (resolve, reject) => {
		for (const file of files) {
			const data = await readFile(file, reader);
			dataLength += data.length;
			// youtubeFormat.value = data;
			convertAnnotationData(data, false, false);
		}
		resolve();
		updateFormatLengths(true, dataLength, dataLength);
		updateUniqueAttributes();
	});
}

async function readFile(file, fileReader) {
	const reader = fileReader || new FileReader();
	return new Promise(async (resolve, reject) => {
		try {
			reader.addEventListener("load", () => {
				resolve(reader.result);
			});
			reader.readAsText(file);
		}
		catch(e) {
			reject(e);
		}
	});
}

function convertAnnotationData(xml, serialize = true, updateLengths = true, updateUnique = true) {
	const annotationElements = parser.getAnnotationsFromXml(xml);
	const parsed = parser.parseYoutubeAnnotationList(annotationElements);
	// collect stats
	for (const annotation of annotationElements) {

		const type = annotation.getAttribute("type");
		const style = annotation.getAttribute("style");

		if (type && !typeSet.has(type)) typeSet.add(type);
		if (style && !styleSet.has(style)) styleSet.add(style);

		const actionElement = annotation.getElementsByTagName("action")[0];
		if (actionElement) {
			const actionType = actionElement.getAttribute("type");
			const actionTrigger = actionElement.getAttribute("trigger");

			if (actionType && !actionTypeSet.has(actionType)) actionTypeSet.add(actionType);
			if (actionTrigger && !actionTriggerSet.has(actionTrigger)) actionTriggerSet.add(actionTrigger);
		}

		const segmentElement = annotation.getElementsByTagName("segment")[0];
		if (!segmentElement) continue;
		const movingRegionElement = segmentElement.getElementsByTagName("movingRegion")[0];
		if (movingRegionElement) {
			const regionType = movingRegionElement.getAttribute("type");
			if (regionType && !regionTypeSet.has(regionType)) regionTypeSet.add(regionType);
		}

		const triggerElement = annotation.getElementsByTagName("trigger")[0];
		if (!triggerElement) continue;
		const conditionElement = triggerElement.getElementsByTagName("condition")[0];
		if (conditionElement) {
			const triggerState = conditionElement.getAttribute("state");
			if (triggerState && !triggerStateSet.has(triggerState)) triggerStateSet.add(triggerState);
		}
	}

	if (serialize) arFormat.value = parser.serializeAnnotationList(parsed);

	if (updateLengths) updateFormatLengths(false, youtubeFormat.value.length, arFormat.value.length);
	if (updateUnique) updateUniqueAttributes();
}

function updateUniqueAttributes() {
	const types = Array.from(typeSet);
	const styles = Array.from(styleSet);

	const actionTypes = Array.from(actionTypeSet);
	const actionTriggers = Array.from(actionTriggerSet);

	const regionTypes = Array.from(regionTypeSet);
	const triggerStates = Array.from(triggerStateSet);

	uniqueTypes.textContent = types.join(", ");
	uniqueStyles.textContent = styles.join(", ");

	uniqueActionTypes.textContent = actionTypes.join(", ");
	uniqueActionTriggers.textContent = actionTriggers.join(", ");

	uniqueRegionTypes.textContent = regionTypes.join(", ");
	uniqueTriggerStates.textContent = triggerStates.join(", ");
}

function updateFormatLengths(multi = false, youtubeLength = youtubeFormat.value.length, arLength = arFormat.value.length) {
	youtubeFormatLength.textContent = `${youtubeLength} characters ${multi ? "(cumulative)" : ""}`;
	const percentSaved = 100 - ((arLength / youtubeLength) * 100);
	arFormatLength.textContent = `${arLength} characters (-${percentSaved.toFixed(2)}%)`;
}
