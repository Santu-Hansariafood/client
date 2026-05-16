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
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#000',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
  },
  tallyBorder: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 10,
    marginBottom: 10,
  },
  logoContainer: {
    width: '20%',
  },
  logo: {
    width: 60,
    height: 40,
    objectFit: 'contain',
  },
  companyInfo: {
    width: '80%',
    textAlign: 'center',
  },
  companyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  companyAddress: {
    fontSize: 8,
    lineHeight: 1.2,
  },
  reportTitleContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 5,
    marginBottom: 10,
    textAlign: 'center',
  },
  reportTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  detailsGrid: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 8,
    marginBottom: 0,
  },
  detailsColumn: {
    flex: 1,
    paddingRight: 10,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  detailLabel: {
    width: 70,
    fontWeight: 'bold',
    fontSize: 8,
  },
  detailValue: {
    flex: 1,
    fontSize: 8,
  },
  table: {
    width: '100%',
    marginTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    backgroundColor: '#f2f2f2',
  },
  tableHeaderCell: {
    padding: 4,
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    minHeight: 20,
    alignItems: 'center',
  },
  tableCell: {
    padding: 4,
    fontSize: 8,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  summarySection: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  summaryLeft: {
    flex: 3,
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  summaryRight: {
    flex: 1,
    padding: 5,
  },
  amountInWords: {
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    fontSize: 8,
  },
  bankSection: {
    padding: 5,
    flexDirection: 'row',
  },
  bankTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 4,
    textDecoration: 'underline',
  },
  signatureSection: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 10,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 7,
    color: '#666',
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
  const totalLoadingWeight = entries.reduce((sum, e) => sum + (e.loadingWeight || 0), 0);
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
              Phone: +91 33 2268 4567 | Email: info@hansariafood.com
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
          <View style={[styles.detailsColumn, { borderLeftWidth: 1, borderLeftColor: '#000', paddingLeft: 10 }]}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Report No:</Text>
              <Text style={styles.detailValue}>HF/PR/{new Date().getFullYear()}/{Math.floor(Math.random() * 1000)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Dated:</Text>
              <Text style={styles.detailValue}>{new Date().toLocaleDateString('en-IN')}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>GSTIN:</Text>
              <Text style={styles.detailValue}>{company.gstNo || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '10%' }]}>S.No</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Sauda No</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Lorry No</Text>
            <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Load Qty</Text>
            <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Unload Qty</Text>
            <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Commodity</Text>
            <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Rate/T</Text>
            <Text style={[styles.tableHeaderCell, { width: '12%', borderRightWidth: 0 }]}>Brokerage</Text>
          </View>
          {entries.map((entry, index) => {
            const ratePerTon = entry.unloadingWeight > 0 ? (entry.sellerBrokerage / entry.unloadingWeight).toFixed(2) : '0.00';
            return (
              <View style={styles.tableRow} key={index}>
                <Text style={[styles.tableCell, { width: '10%' }]}>{index + 1}</Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>{entry.saudaNo || '-'}</Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>{entry.lorryNumber}</Text>
                <Text style={[styles.tableCell, { width: '12%' }]}>{entry.loadingWeight?.toFixed(2) || '0.00'}</Text>
                <Text style={[styles.tableCell, { width: '12%' }]}>{entry.unloadingWeight?.toFixed(2) || '0.00'}</Text>
                <Text style={[styles.tableCell, { width: '12%' }]}>{entry.commodity}</Text>
                <Text style={[styles.tableCell, { width: '12%' }]}>{ratePerTon}</Text>
                <Text style={[styles.tableCell, { width: '12%', borderRightWidth: 0, textAlign: 'right' }]}>
                  {entry.sellerBrokerage?.toFixed(2)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Summary Table-like Bottom */}
        <View style={styles.summarySection}>
          <View style={styles.summaryLeft}>
            <Text style={{ fontSize: 8, fontWeight: 'bold' }}>Total:</Text>
          </View>
          <View style={[styles.tableCell, { width: '12%', borderRightWidth: 1 }]}>
            <Text style={{ fontWeight: 'bold' }}>{totalLoadingWeight.toFixed(2)}</Text>
          </View>
          <View style={[styles.tableCell, { width: '12%', borderRightWidth: 1 }]}>
            <Text style={{ fontWeight: 'bold' }}>{totalWeight.toFixed(2)}</Text>
          </View>
          <View style={[styles.tableCell, { width: '24%', borderRightWidth: 1 }]}>
            <Text></Text>
          </View>
          <View style={[styles.tableCell, { width: '12%', borderRightWidth: 0, textAlign: 'right' }]}>
            <Text style={{ fontWeight: 'bold' }}>Rs. {totalBrokerage.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>

        {/* Amount in Words */}
        <View style={styles.amountInWords}>
          <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>Amount Chargeable (in words):</Text>
          <Text style={{ textTransform: 'capitalize' }}>{numberToWords(totalBrokerage)}</Text>
        </View>

        {/* Bank & Signature */}
        <View style={{ flexDirection: 'row', height: 100 }}>
          <View style={{ flex: 1, borderRightWidth: 1, borderColor: '#000', padding: 5 }}>
            <Text style={styles.bankTitle}>Bank Details:</Text>
            <Text style={{ fontSize: 7 }}>A/c Name : HANSARIA FOOD PRIVATE LIMITED</Text>
            <Text style={{ fontSize: 7 }}>A/c No.   : [PROVIDE ACCOUNT NO]</Text>
            <Text style={{ fontSize: 7 }}>Bank Name: [PROVIDE BANK NAME]</Text>
            <Text style={{ fontSize: 7 }}>IFSC Code: [PROVIDE IFSC]</Text>
          </View>
          <View style={{ flex: 1, padding: 5, textAlign: 'right' }}>
            <Text style={{ fontSize: 8, fontWeight: 'bold' }}>for HANSARIA FOOD PRIVATE LIMITED</Text>
            <View style={{ marginTop: 40 }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold' }}>Authorised Signatory</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This is a Computer Generated Report</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};

export default ProformaInvoicePDF;
