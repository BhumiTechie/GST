const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

exports.calculateAndFileGST = functions.firestore
    .document("bookings/{bookingId}")
    .onUpdate(async (change, context) => {
      const newValue = change.after.data();
      const previousValue = change.before.data();

      // Check if the status changed to "finished"
      if (
        newValue.status === "finished" &&
        previousValue.status !== "finished"
      ) {
        const totalAmount = newValue.totalBookingAmount;
        const gstRate = 0.18;
        const gstAmount = totalAmount * gstRate;

        // Splitting GST into IGST, SGST, and CGST
        const igst = gstAmount * 0.5; // 50% IGST
        const sgst = gstAmount * 0.25; // 25% SGST
        const cgst = gstAmount * 0.25; // 25% CGST

        console.log(`IGST: ${igst}, SGST: ${sgst}, CGST: ${cgst}`);

        try {
          const response = await axios.post(
              "https://api.example.com/fileGST",
              {
                name: newValue.name,
                totalAmount: totalAmount,
                igst: igst,
                sgst: sgst,
                cgst: cgst,
              },
          );

          console.log("GST filed successfully:", response.data);
          return response.data;
        } catch (error) {
          console.error("Error filing GST:", error);
          throw new functions.https.HttpsError(
              "internal",
              "GST filing failed",
          );
        }
      } else {
        return null;
      }
    });
