const convertButton = document.getElementById("convert-button");
const youtubeFormat = document.getElementById("youtube-format");
const arFormat = document.getElementById("ar-format");

const fileInput = document.getElementById("file-input");

youtubeFormat.value = "";
arFormat.value = "";

const youtubeLength = document.getElementById("youtube-format-length");
const arFormatLength = document.getElementById("ar-format-length");

const parser = new AnnotationParser();

convertButton.addEventListener("click", e => {
	if (youtubeFormat.value) {
		const annotationElements = parser.getAnnotationsFromXml(youtubeFormat.value);
		const parsed = parser.parseYoutubeFormat(annotationElements);

		arFormat.value = parser.serializeAnnotationList(parsed);

		youtubeLength.textContent = youtubeFormat.value.length;
		const perc = arFormat.value.length / youtubeFormat.value.length;
		arFormatLength.textContent = `${arFormat.value.length} (${perc.toFixed(2)}%)`;
	}
});

fileInput.value = "";
fileInput.addEventListener("change", e => {
	const data = fileInput.files[0];

	const reader = new FileReader();
	reader.addEventListener("load", () => {
		const text = reader.result;
		youtubeFormat.value = text;
	});
	reader.readAsText(data);
});