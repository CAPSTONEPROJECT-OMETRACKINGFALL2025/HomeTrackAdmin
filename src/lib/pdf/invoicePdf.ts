type User = {
  userId: string;
  username: string;
  email: string;
  roleId: number;
  roleName: string;
  pictureProfile: string;
  dateOfBirth: string;
  phone: string;
  status: boolean;
  isPremium: boolean;
  isEmailVerified: boolean;
};

type OrderDetail = {
  id: string;
  orderCode: number;
  userId: string;
  subscriptionId: string | null;
  planPriceId: string;
  amountVnd: number;
  status: number;
  returnUrl: string;
  cancelUrl: string;
  createdAt: string;
  paidAt: string | null;
  user?: User;
};

export const generateInvoicePDF = async (order: OrderDetail) => {
  try {
    // Dynamic import of jsPDF
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;
    const col1X = margin;
    const col2X = margin + 80;

    // Helper function to add text with word wrap
    const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10, align: "left" | "center" | "right" = "left") => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y, { align });
      return y + (lines.length * fontSize * 0.4);
    };

    // Helper function to draw a line
    const drawLine = (y: number) => {
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
    };

    // Header Section
    doc.setFillColor(70, 95, 255); // Brand color
    doc.rect(0, 0, pageWidth, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", margin, 25);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Order #${order.orderCode}`, pageWidth - margin, 25, { align: "right" });

    yPosition = 50;

    // Company/Service Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("HomeTrack", margin, yPosition);
    
    doc.setFont("helvetica", "normal");
    yPosition += 6;
    doc.setFontSize(9);
    doc.text("Invoice Management System", margin, yPosition);
    yPosition += 6;
    doc.text("Email: support@hometrack.com", margin, yPosition);
    yPosition += 6;
    doc.text("Website: www.hometrack.com", margin, yPosition);

    yPosition += 10;
    drawLine(yPosition);
    yPosition += 10;

    // User Information Section (if available)
    if (order.user) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Bill To", margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      const userInfo = [
        ["Name:", order.user.username],
        ["Email:", order.user.email],
      ];

      if (order.user.phone) {
        userInfo.push(["Phone:", order.user.phone]);
      }

      userInfo.push(["Role:", order.user.roleName]);

      if (order.user.dateOfBirth) {
        const dob = new Date(order.user.dateOfBirth).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        userInfo.push(["Date of Birth:", dob]);
      }

      userInfo.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, col1X, yPosition);
        doc.setFont("helvetica", "normal");
        const valueLines = doc.splitTextToSize(value, contentWidth - 80);
        doc.text(valueLines, col2X, yPosition);
        yPosition += Math.max(6, valueLines.length * 6);
      });

      yPosition += 10;
      drawLine(yPosition);
      yPosition += 10;
    }

    // Invoice Details Section
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Invoice Details", margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const details = [
      ["Invoice Number:", `#${order.orderCode}`],
      ["Order ID:", order.id],
      ["User ID:", order.userId],
      ["Status:", order.status === 1 ? "Paid" : order.status === 0 ? "Pending" : "Cancelled"],
      ["Plan Price ID:", order.planPriceId],
    ];

    details.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, col1X, yPosition);
      doc.setFont("helvetica", "normal");
      const valueLines = doc.splitTextToSize(value, contentWidth - 80);
      doc.text(valueLines, col2X, yPosition);
      yPosition += Math.max(6, valueLines.length * 6);
    });

    if (order.subscriptionId) {
      yPosition += 2;
      doc.setFont("helvetica", "bold");
      doc.text("Subscription ID:", col1X, yPosition);
      doc.setFont("helvetica", "normal");
      const subLines = doc.splitTextToSize(order.subscriptionId, contentWidth - 80);
      doc.text(subLines, col2X, yPosition);
      yPosition += Math.max(6, subLines.length * 6);
    }

    yPosition += 10;
    drawLine(yPosition);
    yPosition += 10;

    // Amount Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Amount Due", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(70, 95, 255);
    const amountText = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(order.amountVnd);
    doc.text(amountText, margin, yPosition);
    
    doc.setTextColor(0, 0, 0);
    yPosition += 10;
    drawLine(yPosition);
    yPosition += 10;

    // Date Information
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Date Information", margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const createdDate = new Date(order.createdAt).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    doc.setFont("helvetica", "bold");
    doc.text("Created At:", col1X, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(createdDate, col2X, yPosition);
    yPosition += 8;

    if (order.paidAt) {
      const paidDate = new Date(order.paidAt).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      doc.setFont("helvetica", "bold");
      doc.text("Paid At:", col1X, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(paidDate, col2X, yPosition);
      yPosition += 8;
    }

    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }

    yPosition += 10;
    drawLine(yPosition);
    yPosition += 10;

    // Footer
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(128, 128, 128);
    const footerText = "Thank you for your business!";
    doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: "center" });
    
    doc.setFontSize(8);
    doc.text("This is a computer-generated invoice.", pageWidth / 2, pageHeight - 10, { align: "center" });

    // Save the PDF
    const fileName = `Invoice-${order.orderCode}-${new Date().getTime()}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error("Error generating PDF:", error);
    if (error instanceof Error && error.message.includes("jspdf")) {
      throw new Error("jsPDF library is not installed. Please run: npm install jspdf");
    }
    throw error;
  }
};

