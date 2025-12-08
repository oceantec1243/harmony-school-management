"use client"

function replaceOklchColors(element: HTMLElement): Map<HTMLElement, string> {
  const originalStyles = new Map<HTMLElement, string>()

  // Common oklch to RGB mappings for Tailwind CSS v4
  const oklchToRgb: Record<string, string> = {
    // Backgrounds
    "oklch(1 0 0)": "#ffffff",
    "oklch(0 0 0)": "#000000",
    "oklch(0.985 0 0)": "#fafafa",
    "oklch(0.97 0 0)": "#f5f5f5",
    "oklch(0.96 0 0)": "#f0f0f0",
    "oklch(0.95 0 0)": "#ededed",
    "oklch(0.93 0 0)": "#e5e5e5",
    "oklch(0.9 0 0)": "#d9d9d9",
    "oklch(0.87 0 0)": "#cccccc",
    "oklch(0.83 0 0)": "#b3b3b3",
    "oklch(0.7 0 0)": "#808080",
    "oklch(0.55 0 0)": "#5c5c5c",
    "oklch(0.45 0 0)": "#474747",
    "oklch(0.37 0 0)": "#363636",
    "oklch(0.27 0 0)": "#262626",
    "oklch(0.21 0 0)": "#1a1a1a",
    "oklch(0.145 0 0)": "#0f0f0f",
    "oklch(0.1 0 0)": "#0a0a0a",
    // Primary colors (emerald-like)
    "oklch(0.765 0.177 163)": "#10b981",
    "oklch(0.696 0.17 162.48)": "#059669",
    "oklch(0.627 0.141 149.214)": "#047857",
    // Destructive (red)
    "oklch(0.577 0.245 27.325)": "#dc2626",
    "oklch(0.637 0.237 25.331)": "#ef4444",
  }

  const allElements = element.querySelectorAll("*")
  const elementsToProcess = [element, ...Array.from(allElements)] as HTMLElement[]

  elementsToProcess.forEach((el) => {
    if (el instanceof HTMLElement) {
      const computedStyle = window.getComputedStyle(el)
      const stylesToCheck = [
        "backgroundColor",
        "color",
        "borderColor",
        "borderTopColor",
        "borderBottomColor",
        "borderLeftColor",
        "borderRightColor",
      ]

      let hasOklch = false
      const originalCssText = el.style.cssText

      stylesToCheck.forEach((prop) => {
        const value = computedStyle.getPropertyValue(prop.replace(/([A-Z])/g, "-$1").toLowerCase())
        if (value && value.includes("oklch")) {
          hasOklch = true
          // Find replacement or default to a safe color
          let replacement = "#888888"
          for (const [oklch, rgb] of Object.entries(oklchToRgb)) {
            if (value.includes(oklch) || value.replace(/\s/g, "").includes(oklch.replace(/\s/g, ""))) {
              replacement = rgb
              break
            }
          }
          // Try to extract and convert oklch values
          const oklchMatch = value.match(/oklch$$([^)]+)$$/)
          if (oklchMatch) {
            const parts = oklchMatch[1].split(/\s+/)
            if (parts.length >= 1) {
              const lightness = Number.parseFloat(parts[0])
              // Simple grayscale conversion for neutral colors
              if (parts.length === 1 || (parts.length >= 2 && Number.parseFloat(parts[1]) < 0.02)) {
                const gray = Math.round(lightness * 255)
                replacement = `rgb(${gray}, ${gray}, ${gray})`
              }
            }
          }
          const cssProp = prop.replace(/([A-Z])/g, "-$1").toLowerCase()
          el.style.setProperty(cssProp, replacement, "important")
        }
      })

      if (hasOklch) {
        originalStyles.set(el, originalCssText)
      }
    }
  })

  return originalStyles
}

function restoreOklchColors(originalStyles: Map<HTMLElement, string>) {
  originalStyles.forEach((cssText, el) => {
    el.style.cssText = cssText
  })
}

// PDF Generation utilities using html2canvas and jsPDF
export async function generatePDF(
  elementId: string,
  filename: string,
  orientation: "portrait" | "landscape" = "portrait",
) {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error("Element not found")
  }

  const originalStyles = replaceOklchColors(element)

  // Dynamically import libraries
  const html2canvas = (await import("html2canvas")).default
  const { jsPDF } = await import("jspdf")

  try {
    // Capture the element as a canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    })

    restoreOklchColors(originalStyles)

    const imgData = canvas.toDataURL("image/png")

    // Calculate dimensions
    const imgWidth = orientation === "landscape" ? 297 : 210 // A4 width in mm
    const pageHeight = orientation === "landscape" ? 210 : 297 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format: "a4",
    })

    let heightLeft = imgHeight
    let position = 0

    // Add image, potentially across multiple pages
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    pdf.save(filename)
  } catch (error) {
    restoreOklchColors(originalStyles)
    throw error
  }
}

export async function generateBulkPDF(elements: Array<{ id: string; filename: string }>, zipFilename: string) {
  const JSZip = (await import("jszip")).default
  const html2canvas = (await import("html2canvas")).default
  const { jsPDF } = await import("jspdf")

  const zip = new JSZip()

  for (const { id, filename } of elements) {
    const element = document.getElementById(id)
    if (!element) continue

    const originalStyles = replaceOklchColors(element)

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      })

      restoreOklchColors(originalStyles)

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)

      const pdfBlob = pdf.output("blob")
      zip.file(filename, pdfBlob)
    } catch (error) {
      restoreOklchColors(originalStyles)
      console.error(`Error generating PDF for ${id}:`, error)
    }
  }

  const content = await zip.generateAsync({ type: "blob" })

  // Download zip
  const link = document.createElement("a")
  link.href = URL.createObjectURL(content)
  link.download = zipFilename
  link.click()
}

export async function generateMultiPagePDF(
  elementIds: string[],
  filename: string,
  orientation: "portrait" | "landscape" = "portrait",
) {
  const html2canvas = (await import("html2canvas")).default
  const { jsPDF } = await import("jspdf")

  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  })

  const imgWidth = orientation === "landscape" ? 297 : 210
  const pageHeight = orientation === "landscape" ? 210 : 297

  for (let i = 0; i < elementIds.length; i++) {
    const element = document.getElementById(elementIds[i])
    if (!element) continue

    const originalStyles = replaceOklchColors(element)

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      })

      restoreOklchColors(originalStyles)

      const imgData = canvas.toDataURL("image/png")
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      if (i > 0) {
        pdf.addPage()
      }

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)

      // Handle multi-page content for single bulletin
      let heightLeft = imgHeight - pageHeight
      while (heightLeft > 0) {
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, -(imgHeight - heightLeft), imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
    } catch (error) {
      restoreOklchColors(originalStyles)
      console.error(`Error generating page for ${elementIds[i]}:`, error)
    }
  }

  pdf.save(filename)
}
