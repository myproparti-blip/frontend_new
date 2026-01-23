# Rajesh Flat Backend Model - Required Fields Checklist

This document lists all fields that should be present in the backend RajeshFlat model based on the frontend formData structure.

## Top-Level Fields

```javascript
{
  _id: String,
  clientId: String,
  uniqueId: String,
  username: String,
  dateTime: String,
  day: String,
  bankName: String,
  city: String,
  clientName: String,
  mobileNumber: String,
  address: String,
  payment: String,
  collectedBy: String,
  dsa: String,
  customDsa: String,
  engineerName: String,
  customEngineerName: String,
  notes: String,
  selectedForm: String,
  elevation: String,
  propertyImages: Array,
  locationImages: Array,
  bankImage: String/Object,
  documentPreviews: Array,
  status: String,
  managerFeedback: String,
  submittedByManager: Boolean,
  lastUpdatedBy: String,
  lastUpdatedByRole: String,
  customBankName: String,
  customCity: String,
  reworkComments: String,
  reworkRequestedBy: String,
  reworkRequestedAt: Date,
  reworkRequestedByRole: String,
  customFields: Array,
  directions: {
    north1: String,
    east1: String,
    south1: String,
    west1: String,
    north2: String,
    east2: String,
    south2: String,
    west2: String
  },
  coordinates: {
    latitude: String,
    longitude: String
  },
  photos: {
    elevationImages: Array,
    siteImages: Array
  },
  areaImages: Object,
  pdfDetails: { ... }, // See below
  checklist: { ... },  // See below
  customValuationItems: Array,
  createdAt: Date,
  updatedAt: Date,
  lastUpdatedAt: Date
}
```

## PDF Details Fields (Should support both NESTED and FLAT structures)

The backend model should support a nested structure that can be flattened to match the frontend's flat structure:

### NESTED STRUCTURE (Current API Response Format)

```javascript
pdfDetails: {
  // Valuation Header Section
  valuationHeader: {
    applicant: String,
    valuationDoneBy: String,
    purposeForValuation: String,
    dateOfInspection: String,
    dateOfValuation: String
  },
  
  // Property Owner Details
  propertyOwnerDetails: {
    nameOfOwner: String,
    ownerAddress: String
  },
  
  // Property Description
  propertyDescription: {
    briefDescriptionOfProperty: String,
    locationOfProperty: String,
    googleMapCoordinates: String,
    otherCommentsByValuers: String
  },
  
  // Location Details
  locationDetails: {
    plotNoSurveyNo: String,
    doorNo: String,
    tsNoVillage: String,
    wardTaluka: String,
    mandalDistrict: String
  },
  
  // Approved Map Details
  approvedMapDetails: {
    dateOfIssueAndValidity: String,
    approvedMapIssuingAuthority: String,
    genuinessOfApprovedMap: String
  },
  
  // Area and Location Details
  areaAndLocationDetails: {
    postalAddress: String,
    cityTown: String,
    residentialArea: String,
    commercialArea: String,
    industrialArea: String,
    areaClassification: {
      highMiddlePoor: String,
      urbanSemiUrbanRural: String
    },
    corporationLimit: String,
    stateGovernmentEnactments: String
  },
  
  // Site Details
  siteDetails: {
    boundaries: {
      east: {
        saleDeed: String,
        siteVisit: String
      },
      west: {
        saleDeed: String,
        siteVisit: String
      },
      north: {
        saleDeed: String,
        siteVisit: String
      },
      south: {
        saleDeed: String,
        siteVisit: String
      }
    },
    dimensions: {
      east: {
        deed: String,
        actual: String
      },
      west: {
        deed: String,
        actual: String
      },
      north: {
        deed: String,
        actual: String
      },
      south: {
        deed: String,
        actual: String
      }
    },
    extentOfSite: {
      saleDeed: String,
      approvedPlan: String,
      taxBill: String
    },
    extentOfSiteForValuation: String,
    occupancyStatus: String,
    rentReceivedPerMonth: String
  },
  
  // Building and Property Details
  buildingAndProperty: {
    apartmentBuilding: {
      natureOfApartment: String,
      location: {
        tsNo: String,
        blockNo: String,
        wardNo: String,
        villageOrMunicipalityOrCorporation: String,
        doorNoStreetOrRoad: String,
        pinCode: String
      },
      descriptionOfLocality: String,
      yearOfConstruction: String,
      numberOfFloors: String,
      typeOfStructure: String,
      numberOfDwellingUnits: String,
      qualityOfConstruction: String,
      appearanceOfBuilding: String,
      maintenanceOfBuilding: String,
      facilitiesAvailable: {
        lift: String,
        protectedWaterSupply: String,
        undergroundSewerage: String,
        carParking: String,
        compoundWall: String,
        pavementAroundBuilding: String
      }
    },
    flatDetails: {
      floorNumber: String,
      doorNo: String,
      specifications: {
        roof: String,
        flooring: String,
        doors: String,
        windows: String,
        fittings: String,
        finishing: String
      },
      houseTaxDetails: {
        houseTax: String,
        assessmentNo: String,
        taxPaidInNameOf: String,
        taxAmount: String
      },
      electricityServiceConnectionNo: String,
      maintenanceOfUnit: String,
      conveyanceDeedExecutedInNameOf: String,
      undividedAreaOfLand: String,
      plinthArea: String,
      floorSpaceIndex: String,
      carpetArea: String,
      classification: String,
      purposeOfUse: String,
      occupancyType: String,
      monthlyRent: String
    }
  },
  
  // Property Analysis
  propertyAnalysis: {
    marketability: String,
    extraPotentialValueFactors: String,
    negativeFactorsObserved: String
  },
  
  // Rate Analysis
  rateAnalysis: {
    compositeRateAnalysis: String,
    adoptedCompositeRate: String,
    rateBreakup: {
      buildingServices: String,
      landOthers: String
    },
    guidelineRate: String
  },
  
  // Valuation Computation
  valuationComputation: {
    jantriValueDetails: {
      jantriValue: String,
      guideline: String,
      glrMultiplier: String,
      calculatedValue: String,
      details: String
    },
    depreciationDetails: {
      deprecatedBuildingRate: String,
      replacementCostOfFlatWithServices: String,
      ageOfBuilding: String,
      lifeOfBuildingEstimated: String,
      depreciationPercentage: String,
      depreciatedRatioOfBuilding: String,
      totalCompositeRateArrived: String,
      deprecatedBuildingRateV1: String,
      rateForLandAndOther: String,
      totalCompositeRate: String
    },
    valuationDetails: Array,
    totalValueFromValuation: String,
    valuationSummary: {
      marketValue: String,
      marketValueInWords: String,
      realisableValue: String,
      realisableValueInWords: String,
      distressValue: String,
      distressValueInWords: String,
      insurableValue: String,
      insurableValueInWords: String,
      jantriValue: String,
      jantriValueInWords: String
    }
  },
  
  // Documentation
  documentation: {
    documents: {
      saleDeed: String,
      approvedPlan: String,
      buPermission: String,
      constructionPermission: String,
      naLetter: String,
      tcr: String,
      taxBill: String
    },
    documentChecklist: {
      engagementLetterConfirmation: String,
      ownershipDocumentsSaleDeedConveyance: String,
      advTcrLsr: String,
      agreementForSaleBanaKhat: String,
      propertyCard: String,
      mortgageDeed: String,
      leaseDeed: String,
      indexMinusTwo: String,
      vfSevenTwelveInCaseOfLand: String,
      naOrder: String,
      approvedLayoutPlan: String,
      commencementLetter: String,
      buPermission: String,
      eleMeterPhoto: String,
      lightBill: String,
      muniTaxBill: String,
      numberingFlatBungalowPlotNo: String,
      boundariesOfPropertyProperDemarcation: String,
      mergedProperty: String,
      premiseCanBeSeparatedAndEntrance: String,
      landIsLocked: String,
      propertyIsRentedToOtherParty: String,
      ifRentedRentAgreementProvided: String,
      siteVisitPhotos: String,
      selfieWithOwnerIdentifier: String,
      mobileNo: String,
      dataSheet: String,
      tentativeRate: String,
      saleInstanceLocalInquiryVerbalSurvey: String,
      brokerRecording: String,
      pastValuationRate: String
    },
    declarationDetails: {
      valuationReportDate: String,
      informationFurnished: String,
      impartialValuation: String,
      propertyInspectionDate: String,
      subContractingStatement: String,
      yearsAfterValuation: String
    }
  },
  
  // Approval and Certification
  approvalAndCertification: {
    signatureDetails: {
      valuersName: String,
      valuersDesignation: String,
      valuersDate: String,
      valuersPlace: String,
      valuersSignature: String,
      branchManagerName: String,
      branchManagerDate: String,
      branchManagerPlace: String,
      branchManagerSignature: String
    },
    certificationDetails: {
      inspectionDate: String,
      reportDate: String,
      certificateStatement: String,
      fairMarketValue: String,
      fairMarketValueInWords: String
    }
  },
  
  // Construction Details
  constructionDetails: {
    constructionArea: String,
    constructionAreaValue: String,
    revenueDetails: String
  },
  
  // Appointment and Dates
  appointmentAndDates: {
    dateOfAppointment: String,
    dateOfVisit: String,
    dateOfReport: String
  }
}
```

### Additional Flat Fields (if needed for backward compatibility)

The backend should also support these flat fields that the frontend uses:

```javascript
// Account Information
accountName: String,
client: String,
typeOfProperty: String,
propertyDetailsLocation: String,

// Summary Values
valuationDoneByApproved: String,
nameOfOwnerValuation: String,
addressPropertyValuation: String,
requisiteDetailsAsPerSaleDeedAuthoritiesDocuments: String,
areaOfLand: String,
areaOfConstruction: String,
valueOfConstruction: String,
totalMarketValueOfTheProperty: String,
valueOfLand: String,
realizableValue: String,
realizableValueWords: String,
distressValue: String,
distressValueWords: String,
jantriValue: String,
jantriValueWords: String,
insurableValue: String,
insurableValueWords: String,

// Header Section
branchName: String,
branchAddress: String,
customerName: String,

// Introduction
nameAddressOfManager: String,
purposeOfValuationIntro: String,
dateOfInspectionOfProperty: String,
dateOfValuationReport: String,
nameOfTheDeputySuperintendentProperty: String,

// Physical Characteristics
nearbyLandmark: String,
noModifiedSquadsSGHighway: String,
postalAddress: String,
areaOfThePlotLandSupportedByA: String,

// Detailed Property
developedLand: String,
interceptAccessToTheProperty: String,
locationOfThePropertyWithNeighborhoodLayout: String,
detailsOfExistingProperty: String,
descriptionOfAdjoiningProperty: String,
plotNoRevenueNo: String,
villageOrTalukSubRegisterBlock: String,
subRegistryBlock: String,
district: String,
anyOtherAspect: String,

// And many more flat fields... (See frontend formData for complete list)
```

## Checklist Fields

```javascript
checklist: {
  engagementLetter: String,
  engagementLetterReviewed: String,
  saleDeed: String,
  saleDeedReviewed: String,
  tcrLsr: String,
  tcrLsrReviewed: String,
  allotmentLetter: String,
  allotmentLetterReviewed: String,
  kabualatLekh: String,
  kabualatLekhReviewed: String,
  mortgageDeed: String,
  mortgageDeedReviewed: String,
  leaseDeed: String,
  leaseDeadReviewed: String,
  index2: String,
  index2Reviewed: String,
  vf712: String,
  vf712Reviewed: String,
  naOrder: String,
  naOrderReviewed: String,
  approvedPlan: String,
  approvedPlanReviewed: String,
  commencementLetter: String,
  commencementLetterReviewed: String,
  buPermission: String,
  buPermissionReviewed: String,
  eleMeterPhoto: String,
  eleMeterPhotoReviewed: String,
  lightBill: String,
  lightBillReviewed: String,
  muniTaxBill: String,
  muniTaxBillReviewed: String,
  numbering: String,
  numberingReviewed: String,
  boundaries: String,
  boundariesReviewed: String,
  mergedProperty: String,
  mergedPropertyReviewed: String,
  premiseSeparation: String,
  premiseSeparationReviewed: String,
  landLocked: String,
  landLockedReviewed: String,
  propertyRented: String,
  propertyRentedReviewed: String,
  rentAgreement: String,
  rentAgreementReviewed: String,
  siteVisitPhotos: String,
  siteVisitPhotosReviewed: String,
  selfieOwner: String,
  selfieOwnerReviewed: String,
  mobileNo: String,
  mobileNoReviewed: String,
  dataSheet: String,
  dataSheetReviewed: String,
  tentativeRate: String,
  tentativeRateReviewed: String,
  saleInstance: String,
  saleInstanceReviewed: String,
  brokerRecording: String,
  brokerRecordingReviewed: String,
  pastValuationRate: String,
  pastValuationRateReviewed: String
}
```

## Important Notes

1. **Nested vs Flat Structure**: The backend currently returns a nested structure, but the frontend expects a flat structure. The frontend has a `flattenPdfDetails` function to handle this conversion.

2. **Field Mapping**: When the backend receives flat pdfDetails from the frontend, it should convert them to the nested structure for storage. When returning data, it should return the nested structure (frontend will flatten it).

3. **All Fields Should Have Default Values**: All fields should default to empty strings `""` or empty arrays `[]` to prevent undefined errors.

4. **Image Fields**: 
   - `propertyImages`: Array of objects with `url`, `index`, `fileName`, `size`
   - `locationImages`: Array of objects with `url`, `index`
   - `bankImage`: String (base64) or Object with `url`, `fileName`, `size`
   - `documentPreviews`: Array of objects with `fileName`, `size`, `url`
   - `areaImages`: Object with keys as area names, values as arrays of image objects

5. **Custom Fields**: `customFields` should be an array of objects with `name` and `value` properties.

6. **Custom Valuation Items**: `customValuationItems` should be an array of custom valuation item objects.

## Missing Fields Check

Based on the API response provided, all the nested structure fields are present. However, ensure that:

1. ✅ All nested sections are defined
2. ✅ All nested objects within sections are defined  
3. ✅ All primitive fields have default empty string values
4. ✅ Arrays default to empty arrays
5. ✅ Nested objects default to empty objects with their structure

The backend model appears to be correctly structured based on the API response. The main issue was the frontend's ability to flatten the nested structure, which has been fixed.
