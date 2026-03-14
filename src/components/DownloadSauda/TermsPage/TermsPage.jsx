import { View, Text, StyleSheet, Image } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

const feedbackUrl = "https://forms.gle/5EmjSAMvCQ1xLtrm8";

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
      <View style={styles.titleBox}>
        <Text style={styles.title}>TERMS & CONDITIONS</Text>
      </View>
      <View style={styles.section}>
        <View style={styles.mainPointRow}>
          <View style={styles.mainBullet} />
          <Text style={styles.mainText}>Late Delivery Condition</Text>
        </View>
        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            Buyer must confirm with the broker or the concerned party before
            unloading the goods if the delivery is delayed.
          </Text>
        </View>
        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            If unloading is done without confirmation, the buyer cannot deduct
            any late delivery charges.
          </Text>
        </View>
      </View>
      <View style={styles.section}>
        <View style={styles.mainPointRow}>
          <View style={styles.mainBullet} />
          <Text style={styles.mainText}>Detention Condition</Text>
        </View>
        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            Detention charges will be mutually decided between the buyer and the
            seller with confirmation from the broker.
          </Text>
        </View>
      </View>
      <View style={styles.section}>
        <View style={styles.mainPointRow}>
          <View style={styles.mainBullet} />
          <Text style={styles.mainText}>Contract Terms</Text>
        </View>
        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            The seller and the buyer cannot terminate the contract without prior
            notice.
          </Text>
        </View>
        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            Any dispute should first be resolved through mutual discussion
            between the parties.
          </Text>
        </View>
        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            If unresolved, the dispute will be governed by the Indian
            Arbitration and Conciliation Act, 1996. This contract is subject to
            the jurisdiction of West Bengal.
          </Text>
        </View>
        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            Under no circumstances shall the buyer or seller have the right to
            take any legal action against the broker or the brokerage firm.
          </Text>
        </View>
      </View>
      <View style={styles.section}>
        <View style={styles.mainPointRow}>
          <View style={styles.mainBullet} />
          <Text style={styles.mainText}>Special Clauses</Text>
        </View>
        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            The buyer and the seller cannot initiate legal action against the
            broker or the brokerage firm.
          </Text>
        </View>
        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            The broker may appear in court only as a witness.
          </Text>
        </View>
        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            Payments to the broker or any third parties cannot be stopped during
            disputes.
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
            A signed copy of this contract will be sent to the buyer/seller via
            email or fax. The signed copy must be returned to the broker within
            24 hours of receipt via email or fax. This contract shall then be
            considered valid, binding, and enforceable between the parties. If
            no signed copy is received and no comments are made within 24 hours,
            all the terms and conditions shall be deemed accepted by both
            parties.
          </Text>
        </View>

        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            The broker shall not be liable for any monetary losses.
          </Text>
        </View>
        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            Brokerage charges shall apply once the Sauda agreement is finalized.
          </Text>
        </View>
        <View style={styles.subPointRow}>
          <View style={styles.subBullet} />
          <Text style={styles.subText}>
            Brokerage shall be applicable if any Sauda is settled between the
            parties.
          </Text>
        </View>
      </View>
      <View style={styles.feedbackSection}>
        <Text style={styles.feedbackTitle}>
          Scan the QR Code to give feedback or suggestions.{" "}
        </Text>
        {qrCode && <Image src={qrCode} style={styles.qr} />}
        <Text style={styles.feedbackText}>{feedbackUrl}</Text>
      </View>
    </View>
  );
};

export default TermsPage;
