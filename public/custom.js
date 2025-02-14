const { jsPDF } = window.jspdf;

var docsArticleFolders = []; 
var jsonData = [];
var recentArticles = [];
var relatedArticles = [];
let globalObjectId = null;


var urlValues = window.location.href;

// Remove the query string part after the '?' using split()
var urlWithoutQuery = urlValues.split("?")[0];

// Get the last part of the URL (the file name)
var lastPart = urlWithoutQuery.substring(urlWithoutQuery.lastIndexOf("/") + 1);

// Replace the .html extension with .md
lastPart = lastPart.replace(".html", ".md");

var fileName = lastPart;

const editor = new toastui.Editor({
    el: document.querySelector('#editor'),
    previewStyle: 'vertical',
    height: '500px'
});


$(document).ready(function () {
  if (lastPart) {
    fileName = lastPart; 
    loadContent();
  }

});

document.addEventListener("DOMContentLoaded", function () {
    const folderRadio = document.getElementById("folderRadio");
    const fileRadio = document.getElementById("fileRadio");
    const folderNameDiv = document.getElementById("folderNameDiv");
    const fileNameDiv = document.getElementById("fileNameDiv");
    const nameInput = document.getElementById("nameInput");
    const nameLabel = document.getElementById("nameLabel");

    // When the modal is shown, ensure the folder radio is selected and the inputs behave accordingly
    $('#formModal').on('shown.bs.modal', function () {
        folderRadio.checked = true; // Ensure Folder radio is selected when the modal opens
        folderNameDiv.style.display = "block"; // Show Folder Name input
        fileNameDiv.style.display = "block"; // Show File Name input
    });

    // Listen for changes on radio buttons
    folderRadio.addEventListener("change", function () {
        if (folderRadio.checked) {
            // Show both Folder and File Name inputs when Folder is selected
            folderNameDiv.style.display = "block";
            fileNameDiv.style.display = "block";
            nameInput.placeholder = "Enter folder name";
            nameLabel.textContent = "Folder Name";
        }
    });

    fileRadio.addEventListener("change", function () {
        if (fileRadio.checked) {
            // Show only the File Name input when File is selected
            folderNameDiv.style.display = "none"; // Hide Folder Name input
            fileNameDiv.style.display = "block"; // Show File Name input
            nameInput.placeholder = "Enter file name";
            nameLabel.textContent = "File Name"; // Update label to "File Name"
        }
    });
});



function saveDiv(divId, title) {
    var doc = new jsPDF();

    // Ensure that html2canvas works as expected
    html2canvas(document.getElementById(divId), {
        useCORS: true,
        scale: 2,  // To improve quality
        logging: true,  // Optional: for debugging
        allowTaint: true,  // Allows cross-origin images to be used
    }).then(function (canvas) { // Using promise instead of callback
        var imgData = canvas.toDataURL('image/png');

        // Calculate the dimensions of the content to adjust the page size
        var imgWidth = canvas.width * 0.75; // Adjust scale if necessary
        var imgHeight = canvas.height * 0.75; // Adjust scale if necessary
        var pageHeight = doc.internal.pageSize.height;

        // If the image height is greater than the page size, create a new page
        if (imgHeight > pageHeight) {
            var totalPages = Math.ceil(imgHeight / pageHeight);
            for (var i = 0; i < totalPages; i++) {
                if (i > 0) {
                    doc.addPage();
                }
                var yOffset = i * pageHeight;
                doc.addImage(imgData, 'PNG', 10, 10 - yOffset, imgWidth, imgHeight);
            }
        } else {
            doc.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        }

        doc.save(title + '.pdf');
    });
}


function printDiv(divId, title) {
    let heading = fileName.replace('.md', '').toUpperCase();

    let mywindow = window.open('', 'PRINT', 'height=650,width=900,top=100,left=150');
    mywindow.document.write(`<html><head><title>${heading}</title></head><body>`);

    // Get the content of the div
    var content = document.getElementById(divId).innerHTML;

    // Log content before modification
    console.log("Content before modification:");
    console.log(content);

    // Replace all video (HTML5) tags with clickable links to video source
    content = content.replace(/<video[^>]*>.*?<source[^>]+src="([^">]+)".*?<\/video>/gs, function (match, src) {
        // Create a clickable link for the video source
        return `<div><a href="${src}" target="_blank">Watch Video</a></div>`;
    });

    // Replace all iframe tags with clickable links
    content = content.replace(/<iframe[^>]*src="([^">]+)".*?<\/iframe>/gs, function (match, src) {
        // Create a clickable link for the iframe source
        return `<div><a href="${src}" target="_blank">Watch Embedded Content</a></div>`;
    });

    // Remove any div wrapping iframe (if any) and leave only the clickable link
    content = content.replace(/<div[^>]*class="embeddedvideo"[^>]*>.*?<iframe[^>]*src="([^">]+)".*?<\/iframe>.*?<\/div>/gs, function (match, src) {
        return `<div><a href="${src}" target="_blank">Watch Embedded Content</a></div>`;
    });

    // Log content after modification
    console.log("Content after modification:");
    console.log(content);

    // Write the modified content to the window for printing/PDF
    mywindow.document.write(content);
    mywindow.document.write('</body></html>');

    mywindow.document.close(); // necessary for IE >= 10
    mywindow.focus(); // necessary for IE >= 10

    // Trigger the print dialog (for PDF generation)
    mywindow.print();
    mywindow.close();

    return true;
}



//var urlParamss = new URLSearchParams(window.location.search);
var fileWithExtension = fileName;

marked.use({
  headerIds: false,
  mangle: false,
});

// Azure Repo Configs
const organization = "allresponsemedia";
const project = "ARMalytics";
const repository = "Prototypes";
const filePath = fileWithExtension;
const branch = "main";
const PAT =
  "9ms4JFRvY2t6VMwMrmIdNxcW3Ds3tAXWluQhrX0haf80IYsaJJ9mJQQJ99BBACAAAAAIB2kwAAASAZDO6wcb";
const commitMessage = "Updated HElpDocs file";
let prevCommitID;

let htmlContent;
var turndownService = new TurndownService();

// Add a custom rule for iframe (YouTube videos)
turndownService.addRule("iframe", {
  filter: "iframe", // Target iframe tags
  replacement: function (content, node) {
    const src = node.getAttribute("src"); // Get the iframe's source URL
    if (src && src.includes("youtube.com/embed/")) {
      // Convert iframe to Markdown format for YouTube videos
      return `[![YouTube Video](https://img.youtube.com/vi/${
        src.split("/embed/")[1].split("?")[0]
      }/0.jpg)](${src})`;
    }
    return ""; // Return empty for non-YouTube iframes
  },
});

// Add a custom rule for <img> tags
turndownService.addRule("imgWithDimensions", {
  filter: "img",
  replacement: function (content, node) {
    const src = node.getAttribute("src") || "";
    const alt = node.getAttribute("alt") || "";
    const width = node.getAttribute("width") || "";
    const height = node.getAttribute("height") || "";

    // Format dimensions as metadata
    const dimensions = [];
    if (width) dimensions.push(`width=${width}`);
    if (height) dimensions.push(`height=${height}`);
    const dimensionText =
      dimensions.length > 0 ? ` (${dimensions.join(", ")})` : "";

    // Return Markdown image syntax
    return `![${alt}](${src})${dimensionText}`;
  },
});

// Add custom rule for ql-size-small (maps to # heading in Markdown)
turndownService.addRule("size-small", {
  filter: function (node) {
    return (
      (node.nodeName === "SPAN" || node.nodeName === "STRONG") &&
      node.classList.contains("ql-size-small")
    );
  },
  replacement: function (content) {
    return `### ${content}`; // Markdown for size-small: # text
  },
});

// Add custom rule for ql-size-large (maps to ## heading in Markdown)
turndownService.addRule("size-large", {
  filter: function (node) {
    return (
      (node.nodeName === "SPAN" || node.nodeName === "STRONG") &&
      node.classList.contains("ql-size-large")
    );
  },
  replacement: function (content) {
    return `## ${content}`; // Markdown for size-large: ## text
  },
});

// Add custom rule for ql-size-huge (maps to ### heading in Markdown)
turndownService.addRule("size-huge", {
  filter: function (node) {
    return (
      (node.nodeName === "SPAN" || node.nodeName === "STRONG") &&
      node.classList.contains("ql-size-huge")
    );
  },
  replacement: function (content) {
    return `# ${content}`; // Markdown for size-huge: ### text
  },
});

// Add custom rule for <u> tag (underline to Markdown with _text_)
turndownService.addRule("underline", {
  filter: "u",
  replacement: function (content) {
    return `_${content}_`; // Markdown for underline: _text_
  },
});

turndownService.addRule("size-classes", {
  filter: (node) => {
    // Check if the node has any of the size classes
    return (
      node.nodeType === 1 &&
      (node.classList.contains("ql-size-small") ||
        node.classList.contains("ql-size-large") ||
        node.classList.contains("ql-size-huge"))
    );
  },
  replacement: (content, node) => {
    // Remove any existing leading # followed by space before adding the new size class mark
    const cleanContent = content.replace(/^#\s*/, ""); // Remove any # and spaces from the start

    // Check the class and add appropriate heading mark
    if (node.classList.contains("ql-size-small")) {
      return `### ${cleanContent}`; // Corresponds to ### in markdown
    } else if (node.classList.contains("ql-size-large")) {
      return `## ${cleanContent}`; // Corresponds to ## in markdown
    } else if (node.classList.contains("ql-size-huge")) {
      return `# ${cleanContent}`; // Corresponds to # in markdown
    }
  },
});

// Add custom rule for headers
turndownService.addRule("header1", {
  filter: "h1",
  replacement: function (content) {
    return "# " + content; // Converts <h1> to Markdown #
  },
});

turndownService.addRule("header2", {
  filter: "h2",
  replacement: function (content) {
    return "## " + content; // Converts <h2> to Markdown ##
  },
});

turndownService.addRule("header3", {
  filter: "h3",
  replacement: function (content) {
    return "### " + content; // Converts <h3> to Markdown ###
  },
});

// Add custom rule to handle <strong> (bold to Markdown with **text**)
turndownService.addRule("strong", {
  filter: "strong",
  replacement: function (content) {
    return `**${content}**`; // Markdown for strong: **text**
  },
});



function GetFileDetails() {
  const url = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repository}/items?scopePath=/&recursionLevel=OneLevel&api-version=7.1`;

  const headers = {
    "Content-Type": "application/json",
    Authorization: "Basic " + btoa(":" + PAT), // Replace with your PAT
  };

  $.ajax({
    url: url,
    type: "GET",
    headers: headers,
    success: function (response) {
      if (response) {
          try {
              $("#spinner").hide();
              console.log("Response File Details", response);
          //const readmeObject = response.value.find(
          //  (item) => item.path === "/" + filePath
          //);
              //prevCommitID = readmeObject.commitId;
              const readmeObject = response.value.find(
                  (item) => item.path === "/" + filePath
              );

              // Check if readmeObject is null before accessing commitId
              if (readmeObject) {
                  prevCommitID = readmeObject.commitId;
              } else {
                  // Handle the case when readmeObject is null
                  console.log('readmeObject not found');
                  // You can assign a default value or perform another action here
                  prevCommitID = null;  // Example of setting a default value
              }


          } catch (e) {
              $("#spinner").hide();
          console.error("Error decoding base64 content:", e);
        }
      } else {
          $("#spinner").hide();
        console.log("File Content:", response);
      }
    },
    error: function (xhr, status, error) {
      console.error("Error fetching file content:", xhr.responseText);
    },
  });
}

GetFileDetails();

function loadReadme() {
  const url = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repository}/items?path=${fileName}&api-version=7.1`;

  const headers = {
    "Content-Type": "application/json",
    Authorization: "Basic " + btoa(":" + PAT), // Replace with your PAT
  };

  $.ajax({
    url: url,
    type: "GET",
    headers: headers,
    success: function (response) {
      if (response) {
        try {
          // Function to preprocess markdown before conversion
          const preprocessMarkdown = (markdown) => {
            // Handle image and width transformation
            markdown = markdown.replace(
              /!\[([^\]]*)\]\(([^)]+)\)\s?\(width=(\d+)\)/g,
              (match, altText, url, width) => {
                return `<p><img src="${url}" width="${width}" alt="${altText}" /></p>`;
              }
            );

            // Handle the combination of **_..._** (bold + italic) and convert it to <strong><u>...</u></strong>
            markdown = markdown.replace(
              /\*\*_(.*?)_\*\*/g,
              (match, content) => {
                return `<strong><u>${content}</u></strong>`;
              }
            );

            return markdown;
          };

          // Function to convert Markdown to HTML
          const convertMarkdownToHTML = (markdown) => {
            // Preprocess Markdown (handle images, width, and **_..._** transformation)
            const preprocessedMarkdown = preprocessMarkdown(markdown);

            // Convert using marked.js
            const html = marked.parse(preprocessedMarkdown);

            // Post-process HTML to ensure headers are bold (using <strong> inside headers)
            const postProcessedHtml = html.replace(
              /<(h[1-6])>(.*?)<\/\1>/g,
              (match, tag, content) => {
                return `<${tag}><strong>${content}</strong></${tag}>`;
              }
            );

            // Ensure content after image goes to the next paragraph
            return postProcessedHtml;
          };

          var data = convertMarkdownToHTML(response);
          // Example usage with Quill
          //quill.clipboard.dangerouslyPasteHTML(convertMarkdownToHTML(response));

          // quill.root.innerHTML = convertMarkdownToHTML(response);
          quill.clipboard.dangerouslyPasteHTML(data);
        } catch (e) {
          console.error("Error decoding base64 content:", e);
        }
      } else {
        console.log("File Content:", response);
      }
    },
    error: function (xhr, status, error) {
      console.error("Error fetching file content:", xhr.responseText);
    },
  });
  // console.log("html", data);
  // return htmlContent;
}

function loadContent() {
    $("#spinner").show();
    const url = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repository}/items?path=${fileName}&api-version=7.1`;

    const headers = {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(":" + PAT), // Replace with your PAT
    };

    $.ajax({
        url: url,
        type: "GET",
        headers: headers,
        success: function (response) {
            if (response) {
                try {
                    $("#spinner").hide();
                    // Function to preprocess markdown before conversion
                    const preprocessMarkdown = (markdown) => {
                        markdown = markdown.replace(
                            /!\[([^\]]*)\]\(([^)]+)\)\s?\(width=(\d+)\)/g,
                            (match, altText, url, width) => {
                                return `<p><img src="${url}" width="${width}" alt="${altText}" /></p>`;
                            }
                        );
                        markdown = markdown.replace(
                            /\*\*_(.*?)_\*\*/g,
                            (match, content) => {
                                return `<strong><u>${content}</u></strong>`;
                            }
                        );
                        return markdown;
                    };

                    // Function to convert Markdown to HTML
                    const convertMarkdownToHTML = (markdown) => {
                        const preprocessedMarkdown = preprocessMarkdown(markdown);
                        const html = marked.parse(preprocessedMarkdown);
                        const postProcessedHtml = html.replace(
                            /<(h[1-6])>(.*?)<\/\1>/g,
                            (match, tag, content) => {
                                return `<${tag}><strong>${content}</strong></${tag}>`;
                            }
                        );
                        return postProcessedHtml;
                    };

                    var data = convertMarkdownToHTML(response);
                    document.getElementById("_content").innerHTML = data;
                    $("#spinner").hide();
                } catch (e) {
                    console.error("Error decoding or processing the content:", e);
                    // Handle error in content conversion (e.g., display a user-friendly message)
                    $("#spinner").hide();
                    document.getElementById("_content").innerHTML = "An error occurred while processing the content.";
                }
            } else {
                $("#spinner").hide();
                console.log("Empty response or no content available:", response);
                document.getElementById("_content").innerHTML = "No content available.";
            }
        },
        error: function (xhr, status, error) {
            $("#spinner").hide();
            console.error("Error fetching file content:", xhr.responseText);
            let errorMessage = "An error occurred while fetching the content.";

            // Handle the error based on the response status or specific error codes
            if (xhr.status === 404) {
                console.error("The requested file was not found.");
            } else if (xhr.status === 401) {
                console.error("Unauthorized access. Please check your credentials.");
            } else if (xhr.status === 500) {
                console.error("Internal server error. Please try again later.");
            } else {
                console.error(errorMessage);
            }

            // Display a user-friendly message
            //document.getElementById("_content").innerHTML = errorMessage;
        },
    });
}


function editContent(button) {
  const contentElement = document.getElementById("_content");
  const htmlData = document.getElementById("_content").innerHTML;
  if (contentElement && htmlData) {
    contentElement.style.display = "none"; // Hide _content
  }

  // Show Quill editor and set its content
  const quillContainer = document.getElementById("quill-container");
  quillContainer.style.display = "block";

    getEditContent();
}

function getEditContent() {
    $("#spinner").show();
    const url = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repository}/items?path=${fileName}&api-version=7.1`;

    const headers = {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(":" + PAT), // Replace with your PAT
    };

    $.ajax({
        url: url,
        type: "GET",
        headers: headers,
        success: function (response) {
            if (response) {
                try {
                    editor.insertText(response);
                    $("#spinner").hide();
                } catch (e) {
                    console.error("Error decoding base64 content:", e);
                }
            } else {
                $("#spinner").hide();
                console.log("File Content:", response);
            }
        },
        error: function (xhr, status, error) {
            $("#spinner").hide();
            console.error("Error fetching file content:", xhr.responseText);
        },
    });
}

function cancelEditing() {
  const contentElement = document.getElementById("_content");
  if (contentElement) {
    contentElement.style.display = "block"; // Hide _content
  }

  const quillContainer = document.getElementById("quill-container");
  quillContainer.style.display = "none";
}

// Function to commit changes to the README file
function commitToAzure() {
  var content;

  //if (fileWithExtension.toLowerCase().endsWith(".html")) {
  //  var editorContent = quill.root.innerHTML;
  //  content = editorContent;
  //} else {
  //  var editorContent = quill.root.innerHTML;

  //  content = turndownService.turndown(editorContent);
    //}

    content = editor.getMarkdown();


  const url = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repository}/pushes?api-version=7.1`;

  const headers = {
    "Content-Type": "application/json",
    Authorization: "Basic " + btoa(":" + PAT),
  };

  // Prepare the commit data
  const requestData = {
    refUpdates: [
      {
        name: `refs/heads/${branch}`,
        oldObjectId: prevCommitID, //  empty commit ID for new commit only
      },
    ],
    commits: [
      {
        comment: "Updated " + fileWithExtension + " file.",
        changes: [
          {
            changeType: "edit",
            item: {
              path: "/" + fileWithExtension,
            },
            newContent: {
              content: content,
              contentType: "rawtext",
            },
          },
        ],
      },
    ],
  };

  //Send AJAX request to commit changes
  $.ajax({
    url: url,
    type: "POST",
    headers: headers,
    data: JSON.stringify(requestData),
    success: function (response) {
      alert("Changes updated successfully!");
      window.location.reload();
    },
    error: function (xhr, status, error) {
      alert("Failed to commit changes.");
    },
  });
}

// Trigger the commit on button click
$("#commitChangesButton").on("click", function () {
  commitToAzure();
});


$(document).ready(function () {
    // Get the current URL
    const currentUrl = window.location.href;

    // Check if the URL is the home URL (without params or routes)
    const isHome = currentUrl === "https://localhost:8080/" || currentUrl === "http://localhost:8080/";

    // Find all divs with the class 'targetDiv'
    const targetDivs = document.querySelectorAll(".targetDiv");

    // Hide all divs if it's the home URL
    // if (isHome && targetDivs.length > 0) {
    //   targetDivs.forEach(div => {
    //     div.style.display = "none !important";
    //   });
    // }

    if (isHome && targetDivs.length > 0) {
        targetDivs.forEach(div => {
          div.classList.add("hidden");
        });
      }
      


    if (lastPart) {
      fileName = lastPart; // Get the value of fileName
      console.log("FileName", fileName);
        loadContent();
        getAllFolders();
    }
});


// For Menu and sub menu creation

function getAllFolders() {
    $("#spinner").show();
    const url = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repository}/items/?recursionLevel=Full&includeContentMetadata=true&api-version=7.1&latestProcessedChange=true`;

    const headers = {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(":" + PAT), // Replace with your PAT
    };

    // Corrected params object with commas between key-value pairs
    let params = {
        recursionLevel: "Full", // Ensure "Full" is a string
        includeContentMetadata: true,
        "api-version": "7.1"
    };

    $.ajax({
        url: url,
        type: "GET",
        headers: headers,
        data: params, // Passing the params object to the request
        success: function (response) {
            if (response) {
                try {
                    $("#spinner").hide();
                    console.log("Response",response);

                    docsArticleFolders.splice(0, docsArticleFolders.length);

                    // Add new data
                    docsArticleFolders.push(formatFolderData(response.value));

                    // Populate jsonData
                    jsonData = docsArticleFolders[0]
                        .filter(folder => folder.isFolder === true) 
                        .map(folder => ({
                            path: folder.path,
                            isFolder: folder.isFolder,
                            folderName: folder.name,
                            comment: folder.comment
                        }));


                    // Render UI
                    $("#folderTree").html(buildTree(jsonData));

                    // Clear again after UI update
                    docsArticleFolders.splice(0, docsArticleFolders.length);
                    docsArticleFolders.push(formatFolderData(response.value));
                    getRecentArticles();
                    getRelatedArticles();

                } catch (e) {
                    $("#spinner").hide();
                    console.error("Error decoding base64 content:", e);
                }
            } else {
                $("#spinner").hide();
                console.log("Unable to get Folders and Files :", response);
            }
        },
        error: function (xhr, status, error) {
            $("#spinner").hide();
            console.error("Error fetching folder and files:", xhr.responseText);
        },
    });
}




function formatFolderData(rawData) {
    if (!Array.isArray(rawData)) {
        console.error("Expected rawData to be an array but got:", rawData);
        return [];
    }

    return rawData.map(function (item) {
        return {
            path: item.path,
            isFolder: item.isFolder,
            name: item.path === "/" ? "Root" : item.path.split('/').pop(),
            date: item.latestProcessedChange?.committer?.date || null,
            comment: item.latestProcessedChange?.comment || null
        };
    });
}

function getRecentArticles() {
    var path = window.location.pathname; // Get current page path
    var match = path.match(/^\/([^\/]+)/); // Match the first segment
    var firstDynamicPath = match ? match[1] : ""; // Extract it

    console.log("firstDynamicPath", firstDynamicPath);

    if (Array.isArray(docsArticleFolders) && docsArticleFolders[0]) {
        recentArticles = docsArticleFolders[0]
            .filter(folder => !folder.isFolder && folder.path.includes(firstDynamicPath) && folder.path.endsWith('.md')) // Ensuring isFolder is falsy and path ends with .md
            .map(folder => ({
                path: folder.path,
                name: folder.name,
                isFolder: folder.isFolder || false,
                date: folder.date,
                comment: folder.comment
            }));
    } else {
        console.log("No valid article folders found.");
        hideRecentDocs();
        return [];
    }

    // Filter, sort by date (descending), and get latest 5 articles
    var recentFiles = recentArticles
        .filter(item => item.isFolder !== true && item.date) // Exclude folders and ensure `date` exists
        .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by most recent date
        .slice(0, 5) // Get latest 5
        .map(item => ({
            path: item.path,
            name: item.name,
            comment: item.comment,
            date: item.date
        }));

    console.log("recentFiles", recentFiles);

    if (recentFiles.length === 0) {
        hideRecentDocs();
    } else {
        appendRecentArticles(recentFiles);
    }

    return recentFiles;
}

function getRelatedArticles() {
    let currentUrl = window.location.href;
    let currentSection = "";
    let relatedArticles = [];

    // Split the URL by '/' and find 'Articles' index
    let parts = currentUrl.split('/');
    let index = parts.indexOf("Articles");

    if (index !== -1 && index + 1 < parts.length) {
        currentSection = parts[index + 1];
    }

    if (Array.isArray(docsArticleFolders) && docsArticleFolders.length > 0) {
        relatedArticles = docsArticleFolders[0]
            .filter(folder => !folder.isFolder && folder.path.endsWith('.md') && folder.path.includes('/Docs/Articles/'+ currentSection)) 
            .map(folder => ({
                path: folder.path,
                name: folder.name,
                isFolder: folder.isFolder || false,
                date: folder.date,
                comment: folder.comment
            }));

        console.log("Related Articles", relatedArticles);
    } else {
        console.log("No valid article folders found.");
        hideRelatedDocs();
        return [];
    }

    // Ensure recentArticles exists and is an array
    if (!Array.isArray(recentArticles)) {
        console.log("recentArticles is not a valid array.");
        hideRelatedDocs();
        return [];
    }

    // Filter, sort by date (descending), and get latest 5 articles
    let relatedFiles = relatedArticles
        .filter(item => item.date) // Ensure `date` exists
        .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by most recent date
        .slice(0, 5) // Get latest 5
        .map(item => ({
            path: item.path,
            name: item.name,
            comment: item.comment,
            date: item.date
        }));

    console.log("Latest 5 Related Articles", relatedFiles);

    if (relatedFiles.length === 0) {
        hideRelatedDocs();
    } else {
        appendRelatedArticles(relatedFiles);
    }

    return relatedFiles;
}

// Function to append recent articles to <ul id="recentlyAdded">
function appendRecentArticles(articles) {
    var ul = document.getElementById("recentlyAdded"); // Selecting the target <ul>
    var recentDocsDiv = document.getElementById("recentDocs");

    if (!ul) {
        console.log("Target <ul id='recentlyAdded'> not found!");
        return;
    }

    // Clear existing list before appending new items
    ul.innerHTML = "";

    articles.forEach(article => {
        var li = document.createElement("li");
        var a = document.createElement("a");
        var link = article.path.replace(".md", ".html");
        a.href = window.location.origin + "/HelpDocs" + link;
        a.textContent = article.comment; 
        a.classList.add("link-body-emphasis");
        console.log("a href", a.href);
        li.appendChild(a);
        ul.appendChild(li);
    });

    // Show the div if there are articles
    if (recentDocsDiv) {
        recentDocsDiv.style.display = "block";
    }
}

// Function to append recent articles to <ul id="recentlyAdded">
function appendRelatedArticles(articles) {
    var ul = document.getElementById("relatedAdded"); // Selecting the target <ul>
    var recentDocsDiv = document.getElementById("relatedDocs");

    if (!ul) {
        console.log("Target <ul id='relatedAdded'> not found!");
        return;
    }

    // Clear existing list before appending new items
    ul.innerHTML = "";

    articles.forEach(article => {
        var li = document.createElement("li");
        var a = document.createElement("a");

        var link = article.path.replace(".md", ".html");
        a.href = window.location.origin + "/DocFx" + link; // Add current domain
        a.textContent = article.comment; // Set link text to article name
        a.classList.add("link-body-emphasis");

        li.appendChild(a);
        ul.appendChild(li);
    });
    ``


    // Show the div if there are articles
    if (recentDocsDiv) {
        recentDocsDiv.style.display = "block";
    }
}



// Function to hide the div if no articles are found
function hideRecentDocs() {
    var recentDocsDiv = document.getElementById("recentDocs");
    if (recentDocsDiv) {
        recentDocsDiv.style.display = "none";
    }
}

function hideRelatedDocs() {
    var relatedDocsDiv = document.getElementById("releatedDocs");
    if (relatedDocsDiv) {
        relatedDocsDiv.style.display = "none";
    }
}

function openCustomModal() {
    getAllFolders();
    var myModal = new bootstrap.Modal(document.getElementById('formModal'), {
        keyboard: false  // optional options (like disabling escape key to close modal)
    });
    myModal.show(); // This opens the modal
}

// Event listener to open the modal when the button is clicked
document.getElementById('openModalButton').addEventListener('click', openCustomModal);


function buildTree(data, parentPath = "") {
    let treeHtml = "<ul>";

    // Find direct children of the current parentPath
    let children = data.filter(item =>
        item.isFolder && (item.path !== parentPath) && (item.path.split("/").slice(0, -1).join("/") === parentPath)
    );

    children.forEach(item => {
        let subfolders = data.filter(child => child.isFolder && child.path.startsWith(item.path + "/"));

        treeHtml += `<li data-path='${item.path}'>`;

        // Show toggle icon only if the folder has children
        if (subfolders.length > 0) {
            treeHtml += `<span class='toggle-icon'><i class='fas fa-caret-right'></i></span>`;
        }

        treeHtml += `<span class='folder-icon'><i class='fas fa-folder'></i></span>
                     <span class='folder-name'>${item.folderName}</span>`;

        // Recursively add child folders
        if (subfolders.length > 0) {
            treeHtml += `<div class='sub-tree'>${buildTree(data, item.path)}</div>`;
        }

        treeHtml += "</li>";
    });

    treeHtml += "</ul>";
    return treeHtml;
}


$(document).on("click", ".toggle-icon", function () {
    let subTree = $(this).siblings(".sub-tree");
    let icon = $(this).find("i");
    subTree.toggle();
    icon.toggleClass("fa-caret-right fa-caret-down");
});

// Ensure highlighting of selected folder
$(document).on("click", ".folder-tree li", function (e) {
    e.stopPropagation(); // Prevent event from bubbling to parent elements

    // Remove the 'selected' class from all other items
    $(".folder-tree li").removeClass("selected");
    // Add the 'selected' class to the clicked folder
    $(this).addClass("selected");
});


$("#saveButton").click(function () {

    const folderName = $("#nameInput").val();
    const fileName = $("#fileInput").val(); // Get the value of nameInput
    const type = $("input[name='typeRadio']:checked").val(); // Get the value of the selected radio button (Folder or File)
    const parentFolder = $(".folder-tree li.selected").data("path") || "/"; // Get the selected folder's path (or root if none selected)
    const description = $("#description").val(); // Get the description


    // Create the formData object
    const formData = {
        type: type, // Either 'folder' or 'file'
        folderName: folderName,
        parentFolder: parentFolder,
        description: description,
        fileName: fileName 
    };

    // Log the formData object to the console
    console.log("Form Values:");
    console.log("Type: " + formData.type);
    console.log("Folder/File Name: " + formData.folderName);
    console.log("Parent Folder: " + formData.parentFolder);
    console.log("Description: " + formData.description);
    console.log("FileName: " + formData.fileName);


    // Manually hide the modal using Bootstrap's modal API
    var modal = bootstrap.Modal.getInstance(document.getElementById('formModal')); // Get existing modal instance
    modal.hide(); // This closes the modal and removes the backdrop and modal-open class

    // Reset the form fields (optional)
    $("#folderForm")[0].reset();
    // Reset the radio buttons to default state (Folder selected by default)
    $("#folderRadio").prop('checked', true);
    $("#fileRadio").prop('checked', false);

    getLatestObjectId()
        .then((result) => {
            globalObjectId = result;
            console.log("ObjectID", globalObjectId);
            // Proceed only if globalObjectId is not empty
            if (globalObjectId != '') {
                let tocFile = formData.parentFolder + '/toc.yml';
                console.log("TocFile ", tocFile);
                let tocContent = "";

                // Get TOC content
                return getTocContent(tocFile)
                    .then((response) => {
                        tocContent = response;

                        // Proceed with AddFile only after getting TOC content
                        let path = formData.parentFolder;
                        let fileName = formData.fileName != "" ? formData.fileName : "";
                        let folderName = formData.folderName != "" ? formData.folderName : "";
                        let comment = formData.description != "" ? formData.description : "";

                        console.log("FolderName", folderName);
                        console.log("fileName", fileName);


                        return AddFile(globalObjectId, path, tocContent, folderName, fileName, comment);
                    })
                    .then((result) => {
                        console.log("File added successfully with objectId:", result);
                    })
                    .catch((error) => {
                        console.error("Error:", error);
                    });
            }
        })
        .catch((error) => {
            console.error("Error getting global objectId:", error);
        });

    
    
});

function AddFile(globalObjectId, path, tocContent, folderName, fileName, comment) {
    return new Promise((resolve, reject) => {

        const url = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repository}/pushes?api-version=7.1`;

        console.log("ObjectID", globalObjectId);
        console.log("Path", path);
        console.log("tocContent", tocContent);
        console.log("fileName", fileName);

        // Base64 encode PAT for Authorization
        let encodedPAT = btoa(":" + PAT);

        const headers = {
            "Content-Type": "application/json",
            Authorization: "Basic " + encodedPAT,
        };

        let commitObject = [];

        // Dynamically create commit object based on folderName
        if (fileName !== "" && folderName == "") {
            commitObject = [
                {
                    changeType: "add",
                    item: {
                        path: `${path}/${fileName}.md`, // Correct dynamic path
                    },
                    newContent: {
                        content: `# ${fileName}\n\n`, // Content of the file
                        contentType: "rawtext"
                    }
                },
                {
                    changeType: "edit",
                    item: {
                        path: `${path}/toc.yml`, // Correct dynamic path for toc file
                    },
                    newContent: {
                        content: `${tocContent}\n\n- name: ${fileName.replace(".md", "")}\n  href: ${fileName}.md\n`, // Fixed string formatting
                        contentType: "rawtext"
                    }
                }
            ];
        } else if (folderName != "" && fileName != "") {
            commitObject = [
                {
                    changeType: "add",
                    item: {
                        path: `${path}/${folderName}/${fileName}.md`, // Add file inside folder
                    },
                    newContent: {
                        content: `# ${fileName}\n\n`, // Content of the file
                        contentType: "rawtext"
                    }
                },
                {
                    changeType: "add",
                    item: {
                        path: `${path}/${folderName}/toc.yml`, // Create toc.yml inside folder
                    },
                    newContent: {
                        content: `- name: ${fileName.replace(".md", "")}\n  href: ${fileName}.md\n`, // Fixed string formatting
                        contentType: "rawtext"
                    }
                },
                {
                    changeType: "edit",
                    item: {
                        path: `${path}/toc.yml`, // Update main toc.yml
                    },
                    newContent: {
                        content: `${tocContent}\n- name: ${fileName.replace(".md", "")}\n  href: ${folderName}/toc.yml\n`, // Correct dynamic content formatting
                        contentType: "rawtext"
                    }
                }
            ];
        }

        // Define parameters with dynamic values
        const params = {
            refUpdates: [
                {
                    name: "refs/heads/main",
                    oldObjectId: globalObjectId // Pass dynamic objectId here
                }
            ],
            commits: [
                {
                    comment: comment, // Dynamically pass commit comment here
                    changes: commitObject,
                }
            ]
        };

        // Debug: Output the params being sent
        console.log("Request Parameters: ", JSON.stringify(params, null, 2));

        $.ajax({
            url: url,
            type: "POST",
            headers: headers,
            data: JSON.stringify(params), // Ensure params is properly stringified
            success: function (response) {
                if (response) {
                    try {
                        // Resolve with the objectId and assign to the global variable
                        let result = response; // Assigning the value to global variable
                        resolve(result);
                    } catch (e) {
                        reject("Error parsing the response: " + e);
                    }
                } else {
                    reject("Unable to get a valid response");
                }
            },
            error: function (xhr, status, error) {
                console.error("Error details: ", xhr.responseText);
                reject("Error fetching response: " + xhr.responseText);
            },
        });
    });
}



//function getLatestObjectId() {
//    const url = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repository}/refs?api-version=7.1`;

//    const headers = {
//        "Content-Type": "application/json",
//        Authorization: "Basic " + btoa(":" + PAT),
//    };

//    // Corrected params object with commas between key-value pairs
//    let params = {
//        "api-version": "7.1"
//    };

//    $.ajax({
//        url: url,
//        type: "GET",
//        headers: headers,
//        data: params, // Passing the params object to the request
//        success: function (response) {
//            if (response) {
//                try {

//                    console.log("Response", response.value[0].objectId);
//                    objectId = response.value[0].objectId;

//                } catch (e) {
//                    console.error("Error :", e);
//                }
//            } else {
//                console.log("Unable to get responses :", response);
//            }
//        },
//        error: function (xhr, status, error) {
//            console.error("Error fetching response:", xhr.responseText);
//        },
//    });
//}

function getLatestObjectId() {
    return new Promise((resolve, reject) => {
        const url = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repository}/refs?api-version=7.1`;

        const headers = {
            "Content-Type": "application/json",
            Authorization: "Basic " + btoa(":" + PAT),
        };

        let params = {
            "api-version": "7.1"
        };

        $.ajax({
            url: url,
            type: "GET",
            headers: headers,
            data: params, // Passing the params object to the request
            success: function (response) {
                if (response) {
                    try {
                        // Resolve with the objectId and assign to the global variable
                        let result = response.value[0].objectId;
                        console.log('ObjectIDResult', result);
                        resolve(result);
                    } catch (e) {
                        reject("Error parsing the response: " + e);
                    }
                } else {
                    reject("Unable to get a valid response");
                }
            },
            error: function (xhr, status, error) {
                reject("Error fetching response: " + xhr.responseText);
            },
        });
    });
}

// Usage of the function
//getLatestObjectId()
//    .then(() => {
//        // Now the globalObjectId has been assigned after the request completes
//        console.log("Global objectId:", globalObjectId);
//    })
//    .catch((error) => {
//        console.error("Error:", error);
//    });

// You can use globalObjectId here after the AJAX call completes


function getTocContent(tocFile) {
    return new Promise((resolve, reject) => {
        $("#spinner").show();
        const url = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repository}/items?path=${tocFile}&api-version=7.1`;

        const headers = {
            "Content-Type": "application/json",
            Authorization: "Basic " + btoa(":" + PAT), // Replace with your PAT
        };

        $.ajax({
            url: url,
            type: "GET",
            headers: headers,
            success: function (response) {
                $("#spinner").hide();
                if (response) {
                    try {
                        resolve(response); // Resolve the promise with the response
                    } catch (e) {
                        console.error("Error decoding base64 content:", e);
                        reject("Error decoding base64 content"); // Reject the promise if there is an error
                    }
                } else {
                    reject("No response received");
                }
            },
            error: function (xhr, status, error) {
                $("#spinner").hide();
                console.error("Error fetching file content:", xhr.responseText);
                reject("Error fetching file content"); // Reject the promise on error
            },
        });
    });
}



