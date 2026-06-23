export const SAMPLE_DATA = {
  order: {
    commerceSequentialId: '2044',
    totalAmount: 290,
    creationDate: '2024-07-10T09:00:00.000Z',
    items: [
      {
        commerceSkuId: '00000002456576',
        name: 'PRUEBA DE SUERTE',
        purchasedPrice: 200,
        purchasedQuantity: 1,
        quantity: 0,
        sellingUnitMultiplier: 1,
        measurementUnit: 'un',
        promotions: [{ commerceId: '2351', name: 'Descuento por cantidad', value: -200 }],
        id: 'SV3GBFOYJV',
        refId: '114084',
        ean: '0807655555',
      },
    ],
    clientProfileData: {
      firstName: 'German',
      lastName: 'Cabarro',
      document: '51013250',
      phone: '+59889294581',
    },
    shippingData: {
      address: {
        street: 'cerro de caracoles',
        number: '20003',
        city: 'Maldonado',
        state: 'Maldonado',
        country: 'URY',
      },
      logisticsInfo: [
        {
          deliveryCompany: 'Punta Ballena (Soy Delivery)',
          deliveryChannel: 'delivery',
          shippingEstimateDate: '2024-07-11T07:00:00.000Z',
        },
      ],
    },
    paymentData: {
      transactions: [
        { payments: [{ paymentSystemName: 'En la Entrega - AFINIDAD' }] },
      ],
    },
  },
  root: {
    store: {
      name: 'El Dorado',
      phone: '0800 1990',
      website: 'eldorado.com.uy',
      logo: '',
    },
  },
}
