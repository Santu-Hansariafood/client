import { View, Text, StyleSheet, Image } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

const feedbackUrl = "https://hansariafood.com/feedback";

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },

  titleBox: {
    backgroundColor: "#E8F5E9",
    borderLeft: "6pt solid #1F7A3E",
    padding: 10,
    marginBottom: 12,
  },

  title: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1F7A3E",
    letterSpacing: 1,
  },

  section: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: "#FAFAFA",
    border: "0.5pt solid #E5E7EB",
  },

  mainPointRow: {
    flexDirection: "row",
    marginBottom: 4,
  },

  mainBullet: {
    width: 8,
    height: 8,
    backgroundColor: "#1F7A3E",
    marginRight: 6,
    marginTop: 3,
  },

  mainText: {
    flex: 1,
    fontSize: 9.5,
    fontWeight: "bold",
    color: "#1F2937",
  },

  subPointRow: {
    flexDirection: "row",
    marginLeft: 14,
    marginBottom: 2,
  },

  subBullet: {
    width: 5,
    height: 5,
    backgroundColor: "#F4B400",
    marginRight: 6,
    marginTop: 4,
  },

  subText: {
    flex: 1,
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.4,
  },

  feedbackSection: {
    marginTop: 20,
    paddingTop: 10,
    borderTop: "1pt solid #D1D5DB",
    alignItems: "center",
  },

  feedbackTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#1F2937",
  },

  qr: {
    width: 80,
    height: 80,
  },

  feedbackText: {
    marginTop: 4,
    fontSize: 8,
    color: "#6B7280",
  },
});

const TermsPage = () => {
  const [qrCode, setQrCode] = useState("");

  useEffect(() => {
    QRCode.toDataURL(feedbackUrl).then((url) => {
      setQrCode(url);
    });
  }, []);

  return (
    <View style={styles.container}>
      
      {/* TITLE */}
      <View style={styles.titleBox}>
        <Text style={styles.title}>TERMS & CONDITIONS</Text>
      </View>

      {/* Late Delivery */}
      <View style={styles.section}>
        <View style={styles.mainPointRow}>
          <View style={styles.mainBullet} />
          <Text style={styles.mainText}>Late Delivery Condition</Text>
        </View>

        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            Buyer must confirm with broker or concerned party before unloading goods if delivery is late.
          </Text>
        </View>

        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            If unloading is done without confirmation, buyer cannot deduct late delivery charges.
          </Text>
        </View>
      </View>

      {/* Detention */}
      <View style={styles.section}>
        <View style={styles.mainPointRow}>
          <View style={styles.mainBullet} />
          <Text style={styles.mainText}>Detention Condition</Text>
        </View>

        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            Detention charges will be mutually decided between buyer and seller with broker confirmation.
          </Text>
        </View>
      </View>

      {/* Contract Terms */}
      <View style={styles.section}>
        <View style={styles.mainPointRow}>
          <View style={styles.mainBullet} />
          <Text style={styles.mainText}>Contract Terms</Text>
        </View>

        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            Seller and Buyer cannot terminate the contract without prior notice.
          </Text>
        </View>

        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            Any dispute should first be resolved through mutual discussion.
          </Text>
        </View>

        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            If unresolved, dispute will follow the Indian Arbitration and Conciliation Act 1996.
          </Text>
        </View>

        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            Contract is subject to West Bengal jurisdiction.
          </Text>
        </View>
      </View>

      {/* Special Clauses */}
      <View style={styles.section}>
        <View style={styles.mainPointRow}>
          <View style={styles.mainBullet} />
          <Text style={styles.mainText}>Special Clauses</Text>
        </View>

        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            Buyer and Seller cannot initiate legal action against broker or brokerage firm.
          </Text>
        </View>

        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            Broker may appear in court only as a witness.
          </Text>
        </View>

        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            Payments to broker or third parties cannot be stopped during disputes.
          </Text>
        </View>

        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            Third parties may take legal action if payments are withheld.
          </Text>
        </View>

        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            Signed contract copy must be returned within 24 hours.
          </Text>
        </View>

        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            Broker will not be liable for monetary losses.
          </Text>
        </View>

        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            Brokerage applies once the Sauda agreement is finalized.
          </Text>
        </View>
      </View>

      {/* QR Feedback Section */}
      <View style={styles.feedbackSection}>
        <Text style={styles.feedbackTitle}>
          Scan QR Code to Give Feedback
        </Text>

        {qrCode && <Image src={qrCode} style={styles.qr} />}

        <Text style={styles.feedbackText}>{feedbackUrl}</Text>
      </View>

    </View>
  );
};

export default TermsPage;
