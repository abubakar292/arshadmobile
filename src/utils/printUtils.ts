export function printInNewWindow(html: string, title = 'Print') {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups for this website to print.');
    return;
  }
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for resources to load
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 250);
}
