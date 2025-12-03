"use client"

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

  // Dynamically import libraries
  const html2canvas = (await import("html2canvas")).default
  const { jsPDF } = await import("jspdf")

  // Capture the element as a canvas
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  })

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
}

export async function generateBulkPDF(elements: Array<{ id: string; filename: string }>, zipFilename: string) {
  const JSZip = (await import("jszip")).default
  const html2canvas = (await import("html2canvas")).default
  const { jsPDF } = await import("jspdf")

  const zip = new JSZip()

  for (const { id, filename } of elements) {
    const element = document.getElementById(id)
    if (!element) continue

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    })

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
  }

  const content = await zip.generateAsync({ type: "blob" })

  // Download zip
  const link = document.createElement("a")
  link.href = URL.createObjectURL(content)
  link.download = zipFilename
  link.click()
}
