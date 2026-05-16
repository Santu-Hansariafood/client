import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import logo from '../../assets/Hans.jpg';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottom: '2pt solid #10b981',
    paddingBottom: 10,
  },
  logo: {
    width: 60,
    height: 40,
    objectFit: 'contain',
  },
  headerContent: {
    flex: 1,
    marginLeft: 15,
  },
  hansariaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#065f46',
    textAlign: 'left',
    marginBottom: 2,
  },
  hansariaSubtitle: {
    fontSize: 8,
    textAlign: 'left',
    color: '#374151',
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 15,
    textDecoration: 'underline',
  },
  section: {
    marginBottom: 20,
  },
  companyDetails: {
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 5,
    border: '1pt solid #e5e7eb',
  },
  label: {
    fontWeight: 'bold',
    color: '#4b5563',
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '16.6%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f3f4f6',
    padding: 5,
  },
  tableCol: {
    width: '16.6%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  tableCellHeader: {
    fontWeight: 'bold',
    fontSize: 8,
  },
  tableCell: {
    fontSize: 8,
  },
  bankSection: {
    marginTop: 30,
    padding: 10,
    border: '1pt solid #10b981',
    borderRadius: 5,
  },
  bankTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 8,
    borderTop: '1pt solid #e5e7eb',
    paddingTop: 10,
  }
});

const ProformaInvoicePDF = ({ entries, company }) => {
  const totalWeight = entries.reduce((sum, e) => sum + (e.unloadingWeight || 0), 0);
  const totalBrokerage = entries.reduce((sum, e) => sum + (e.sellerBrokerage || 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src={logo} style={styles.logo} />
          <View style={styles.headerContent}>
            <Text style={styles.hansariaTitle}>HANSARIA FOOD PRIVATE LIMITED</Text>
            <Text style={styles.hansariaSubtitle}>
              Corporate Office: 207, Maharshi Debendra Road, Kolkata - 700007
            </Text>
          </View>
        </View>

        <Text style={styles.invoiceTitle}>PROFORMA INVOICE / PERFORMANCE REPORT</Text>

        {/* Seller Company Details */}
        <View style={styles.section}>
          <View style={styles.companyDetails}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>
              Seller: {company.companyName}
            </Text>
            <Text>GSTIN: {company.gstNo || 'N/A'}</Text>
            <Text>Address: {company.address || 'N/A'}</Text>
            <Text>District: {company.district || 'N/A'}, State: {company.state || 'N/A'}</Text>
          </View>
        </View>

        {/* Unloading Details Table */}
        <View style={styles.section}>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Lorry No</Text></View>
              <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Loading Date</Text></View>
              <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Unloading Date</Text></View>
              <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Commodity</Text></View>
              <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Qty (Tons)</Text></View>
              <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Brokerage</Text></View>
            </View>
            {entries.map((entry, index) => (
              <View style={styles.tableRow} key={index}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{entry.lorryNumber}</Text></View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {entry.loadingDate ? new Date(entry.loadingDate).toLocaleDateString('en-IN') : 'N/A'}
                  </Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {entry.unloadingDate ? new Date(entry.unloadingDate).toLocaleDateString('en-IN') : 'N/A'}
                  </Text>
                </View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{entry.commodity}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{entry.unloadingWeight?.toFixed(2) || '0.00'}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>₹{entry.sellerBrokerage?.toLocaleString('en-IN') || '0'}</Text></View>
              </View>
            ))}
            {/* Totals Row */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCol, { width: '66.4%', backgroundColor: '#f9fafb' }]}>
                <Text style={[styles.tableCell, { fontWeight: 'bold', textAlign: 'right' }]}>TOTAL</Text>
              </View>
              <View style={[styles.tableCol, { backgroundColor: '#f9fafb' }]}>
                <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>{totalWeight.toFixed(2)} T</Text>
              </View>
              <View style={[styles.tableCol, { backgroundColor: '#f9fafb' }]}>
                <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>₹{totalBrokerage.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Hansaria Bank Details (Hardcoded as requested) */}
        <View style={styles.bankSection}>
          <Text style={styles.bankTitle}>PAYMENT TO HANSARIA FOOD PRIVATE LIMITED</Text>
          <Text>Account Name: HANSARIA FOOD PRIVATE LIMITED</Text>
          <Text>Account Number: [USER WILL PROVIDE LATER]</Text>
          <Text>IFSC Code: [USER WILL PROVIDE LATER]</Text>
          <Text>Bank Name: [USER WILL PROVIDE LATER]</Text>
          <Text style={{ marginTop: 10, fontSize: 8, fontStyle: 'italic', color: '#6b7280' }}>
            Note: Please use Sauda Number or Company Name as reference while making payments.
          </Text>
        </View>

        <Text style={styles.footer}>
          This is a system generated report. No signature required.
        </Text>
      </Page>
    </Document>
  );
};

export default ProformaInvoicePDF;
