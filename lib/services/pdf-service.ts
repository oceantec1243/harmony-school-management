"use client"

// Force replace all oklch colors BEFORE html2canvas processes the element

function replaceOklchColorsInElement(element: HTMLElement) {
  // Get all elements including the root
  const allElements = element.querySelectorAll("*")
  const elementsToProcess = [element, ...Array.from(allElements)] as HTMLElement[]

  elementsToProcess.forEach((el) => {
    if (!(el instanceof HTMLElement)) return

    // Get computed style
    const computed = window.getComputedStyle(el)

    // Force override all color-related properties with safe values
    const propsToCheck = [
      "color",
      "backgroundColor",
      "borderColor",
      "borderTopColor",
      "borderBottomColor",
      "borderLeftColor",
      "borderRightColor",
      "outlineColor",
      "textDecorationColor",
      "caretColor",
      "columnRuleColor",
    ]

    propsToCheck.forEach((prop) => {
      try {
        const value = computed.getPropertyValue(prop.replace(/([A-Z])/g, "-$1").toLowerCase())
        if (value && value.includes("oklch")) {
          // Replace with safe fallback
          if (prop === "color") {
            el.style.setProperty(prop.replace(/([A-Z])/g, "-$1").toLowerCase(), "#000000", "important")
          } else if (prop === "backgroundColor") {
            el.style.setProperty("background-color", "#ffffff", "important")
          } else {
            el.style.setProperty(prop.replace(/([A-Z])/g, "-$1").toLowerCase(), "#e2e8f0", "important")
          }
        }
      } catch (e) {
        // Ignore errors
      }
    })

    // Also check the background property (for gradients)
    try {
      const bg = computed.getPropertyValue("background")
      if (bg && bg.includes("oklch")) {
        el.style.setProperty("background", "#f0f0f0", "important")
      }
    } catch (e) {
      // Ignore
    }
  })
}

export async function generatePDF(
  elementId: string,
  filename: string,
  orientation: "portrait" | "landscape" = "portrait",
) {
  const { jsPDF } = await import("jspdf")
  const html2canvas = (await import("html2canvas")).default

  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error("Element not found")
  }

  // Clone the element
  const clone = element.cloneNode(true) as HTMLElement
  clone.id = "pdf-clone-" + Date.now()

  // Set up clone positioning
  clone.style.position = "absolute"
  clone.style.left = "-9999px"
  clone.style.top = "0"
  clone.style.width = orientation === "landscape" ? "297mm" : "210mm"
  clone.style.backgroundColor = "#ffffff"
  clone.style.color = "#000000"

  // Add clone to document temporarily
  document.body.appendChild(clone)

  // Force replace all oklch colors in the clone
  replaceOklchColorsInElement(clone)

  // Create a new canvas manually to avoid html2canvas color parsing
  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  })

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: orientation === "landscape" ? 1123 : 794, // A4 at 96dpi
      windowHeight: orientation === "landscape" ? 794 : 1123,
      ignoreElements: (el) => {
        // Ignore any elements with oklch in their style
        if (el instanceof HTMLElement) {
          const style = el.getAttribute("style") || ""
          return style.includes("oklch")
        }
        return false
      },
    })

    // Remove clone
    document.body.removeChild(clone)

    const imgData = canvas.toDataURL("image/jpeg", 0.95)
    const imgWidth = orientation === "landscape" ? 297 : 210
    const pageHeight = orientation === "landscape" ? 210 : 297
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    pdf.save(filename)
  } catch (error) {
    // Make sure to clean up
    if (document.body.contains(clone)) {
      document.body.removeChild(clone)
    }
    throw error
  }
}

export async function generateBulkPDF(elements: Array<{ id: string; filename: string }>, zipFilename: string) {
  const JSZip = (await import("jszip")).default
  const zip = new JSZip()

  for (const { id, filename } of elements) {
    try {
      const pdfBlob = await generatePDFBlob(id, "portrait")
      if (pdfBlob) {
        zip.file(filename, pdfBlob)
      }
    } catch (error) {
      console.error(`Error generating PDF for ${id}:`, error)
    }
  }

  const content = await zip.generateAsync({ type: "blob" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(content)
  link.download = zipFilename
  link.click()
}

async function generatePDFBlob(
  elementId: string,
  orientation: "portrait" | "landscape" = "portrait",
): Promise<Blob | null> {
  const { jsPDF } = await import("jspdf")
  const html2canvas = (await import("html2canvas")).default

  const element = document.getElementById(elementId)
  if (!element) return null

  const clone = element.cloneNode(true) as HTMLElement
  clone.style.position = "absolute"
  clone.style.left = "-9999px"
  clone.style.top = "0"
  clone.style.width = orientation === "landscape" ? "297mm" : "210mm"
  clone.style.backgroundColor = "#ffffff"

  document.body.appendChild(clone)
  replaceOklchColorsInElement(clone)

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    })

    document.body.removeChild(clone)

    const imgData = canvas.toDataURL("image/jpeg", 0.95)
    const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" })

    const imgWidth = orientation === "landscape" ? 297 : 210
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight)

    return pdf.output("blob")
  } catch (error) {
    if (document.body.contains(clone)) {
      document.body.removeChild(clone)
    }
    return null
  }
}

export async function generateMultiPagePDF(
  elementIds: string[],
  filename: string,
  orientation: "portrait" | "landscape" = "portrait",
) {
  const { jsPDF } = await import("jspdf")
  const html2canvas = (await import("html2canvas")).default

  const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" })
  const imgWidth = orientation === "landscape" ? 297 : 210
  const pageHeight = orientation === "landscape" ? 210 : 297

  for (let i = 0; i < elementIds.length; i++) {
    const element = document.getElementById(elementIds[i])
    if (!element) continue

    const clone = element.cloneNode(true) as HTMLElement
    clone.style.position = "absolute"
    clone.style.left = "-9999px"
    clone.style.backgroundColor = "#ffffff"

    document.body.appendChild(clone)
    replaceOklchColorsInElement(clone)

    try {
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      })

      document.body.removeChild(clone)

      const imgData = canvas.toDataURL("image/jpeg", 0.95)
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      if (i > 0) pdf.addPage()
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight)

      let heightLeft = imgHeight - pageHeight
      while (heightLeft > 0) {
        pdf.addPage()
        pdf.addImage(imgData, "JPEG", 0, -(imgHeight - heightLeft), imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
    } catch (error) {
      if (document.body.contains(clone)) {
        document.body.removeChild(clone)
      }
      console.error(`Error generating page for ${elementIds[i]}:`, error)
    }
  }

  pdf.save(filename)
}
