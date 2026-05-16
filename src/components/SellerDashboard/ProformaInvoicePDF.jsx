import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import logo from '../../assets/Hans.jpg';

// Standard fonts
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#10b981',
    paddingBottom: 15,
    marginBottom: 20,
  },
  logoContainer: {
    width: '25%',
  },
  logo: {
    width: 80,
    height: 50,
    objectFit: 'contain',
  },
  companyInfo: {
    width: '75%',
    textAlign: 'right',
  },
  companyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 4,
  },
  companyAddress: {
    fontSize: 9,
    color: '#666',
    lineHeight: 1.4,
  },
  reportTitleContainer: {
    marginVertical: 20,
    padding: 8,
    backgroundColor: '#f3f4f6',
    textAlign: 'center',
    borderRadius: 4,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  detailsGrid: {
    flexDirection: 'row',
    marginBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 15,
  },
  detailsColumn: {
    flex: 1,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    width: 80,
    fontWeight: 'bold',
    color: '#4b5563',
    fontSize: 9,
  },
  detailValue: {
    flex: 1,
    fontSize: 9,
    color: '#1f2937',
  },
  table: {
    width: '100%',
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#065f46',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    padding: 8,
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.1)',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    minHeight: 28,
    alignItems: 'center',
  },
  tableCell: {
    padding: 6,
    fontSize: 8.5,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  summarySection: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  summaryBox: {
    width: 200,
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryTotal: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountInWords: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
    fontSize: 9,
    fontStyle: 'italic',
  },
  bankSection: {
    marginTop: 30,
    padding: 15,
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  bankTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 10,
    textDecoration: 'underline',
  },
  bankGrid: {
    flexDirection: 'row',
  },
  bankCol: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: '#9ca3af',
    fontSize: 8,
  },
  pageNumber: {
    fontSize: 8,
    color: '#9ca3af',
  }
});

const numberToWords = (num) => {
  if (num === 0) return 'Zero';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const inWords = (n) => {
    if (n < 20) return a[n];
    const d = Math.floor(n / 10);
    const r = n % 10;
    return b[d] + (r !== 0 ? ' ' + a[r] : '');
  };

  const convert = (n) => {
    if (n === 0) return '';
    if (n < 100) return inWords(n);
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
  };

  const whole = Math.floor(num);
  const fraction = Math.round((num - whole) * 100);
  
  let res = convert(whole) + ' Rupees';
  if (fraction > 0) {
    res += ' and ' + convert(fraction) + ' Paise';
  }
  return res + ' Only';
};

const ProformaInvoicePDF = ({ entries, company }) => {
  const totalWeight = entries.reduce((sum, e) => sum + (e.unloadingWeight || 0), 0);
  const totalBrokerage = entries.reduce((sum, e) => sum + (e.sellerBrokerage || 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image src={logo} style={styles.logo} />
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyTitle}>HANSARIA FOOD PRIVATE LIMITED</Text>
            <Text style={styles.companyAddress}>
              207, Maharshi Debendra Road, Kolkata - 700007{"\n"}
              Phone: +91 33 2268 4567 | Email: info@hansariafood.com{"\n"}
              GSTIN: [CORPORATE GSTIN]
            </Text>
          </View>
        </View>

        <View style={styles.reportTitleContainer}>
          <Text style={styles.reportTitle}>Proforma Invoice / Performance Report</Text>
        </View>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailsColumn}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Seller Name:</Text>
              <Text style={styles.detailValue}>{company.companyName}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Address:</Text>
              <Text style={styles.detailValue}>
                {company.address || 'N/A'}{"\n"}
                {company.district ? company.district + ', ' : ''}{company.state || ''}
              </Text>
            </View>
          </View>
          <View style={styles.detailsColumn}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>GSTIN:</Text>
              <Text style={styles.detailValue}>{company.gstNo || 'N/A'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Report Date:</Text>
              <Text style={styles.detailValue}>{new Date().toLocaleDateString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Lorry No</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Load Date</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Unload Date</Text>
            <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Commodity</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Qty (T)</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%', borderRightWidth: 0 }]}>Brokerage</Text>
          </View>
          {entries.map((entry, index) => (
            <View style={styles.tableRow} key={index}>
              <Text style={[styles.tableCell, { width: '20%' }]}>{entry.lorryNumber}</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>
                {entry.loadingDate ? new Date(entry.loadingDate).toLocaleDateString('en-IN') : '-'}
              </Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>
                {entry.unloadingDate ? new Date(entry.unloadingDate).toLocaleDateString('en-IN') : '-'}
              </Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>{entry.commodity}</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>{entry.unloadingWeight?.toFixed(2) || '0.00'}</Text>
              <Text style={[styles.tableCell, { width: '15%', borderRightWidth: 0 }]}>
                Rs. {entry.sellerBrokerage?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryItem}>
              <Text style={{ fontSize: 9, color: '#666' }}>Total Weight:</Text>
              <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{totalWeight.toFixed(2)} MT</Text>
            </View>
            <View style={styles.summaryTotal}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#065f46' }}>Net Brokerage:</Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#065f46' }}>
                Rs. {totalBrokerage.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

        {/* Amount in Words */}
        <View style={styles.amountInWords}>
          <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>Amount in Words:</Text>
          <Text>{numberToWords(totalBrokerage)}</Text>
        </View>

        {/* Bank Details */}
        <View style={styles.bankSection}>
          <Text style={styles.bankTitle}>BANK DETAILS FOR REMITTANCE (HANSARIA FOOD PVT LTD)</Text>
          <View style={styles.bankGrid}>
            <View style={styles.bankCol}>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { width: 100 }]}>Account Name:</Text>
                <Text style={styles.detailValue}>HANSARIA FOOD PRIVATE LIMITED</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { width: 100 }]}>Account Number:</Text>
                <Text style={styles.detailValue}>[PROVIDE ACCOUNT NO]</Text>
              </View>
            </View>
            <View style={styles.bankCol}>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { width: 80 }]}>IFSC Code:</Text>
                <Text style={styles.detailValue}>[PROVIDE IFSC]</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { width: 80 }]}>Bank Name:</Text>
                <Text style={styles.detailValue}>[PROVIDE BANK NAME]</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Hansaria Food Private Limited | Generated on {new Date().toLocaleString('en-IN')}</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
            `Page ${pageNumber} of ${totalPages}`
          )} />
        </View>
      </Page>
    </Document>
  );
};

export default ProformaInvoicePDF;
