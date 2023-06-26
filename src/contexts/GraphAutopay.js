import React, { useState, createContext, useEffect } from 'react'
//The Graph
import { ApolloClient, InMemoryCache, useQuery } from '@apollo/client'
//Utils
import { autopayQuery } from '../utils/queries'
import { decodingAutopayMiddleware, sortDataByProperty } from '../utils/helpers'
//Sort

export const GraphAutopayContext = createContext()

//ApolloClients
const clientPlsmain = new ApolloClient({
  uri: 'https://graph.pulse.domains/subgraphs/name/graphprotocol/tellor-autopay',
  cache: new InMemoryCache(),
})

const clientPlstest = new ApolloClient({
  uri: 'https://v4b.graph.pulse.domains/subgraphs/name/graphprotocol/tellor-autopay',
  cache: new InMemoryCache(),
})

const GraphAutopay = ({ children }) => {
  //Component State
  const [autopayPlsmainData, setAutopayPlsmainData] = useState({})
  const [autopayPlstestData, setAutopayPlstestData] = useState({})
  const [decodedData, setDecodedData] = useState([])
  const [allGraphData, setAllGraphData] = useState(null)
  //Context State
  //Pulsechain(mainnet)
  const plsmain = useQuery(autopayQuery, {
    client: clientPlsmain,
    fetchPolicy: 'network-only',
    pollInterval: 5000,
  })
  //Pulsechain(testnet)
  const plstest = useQuery(autopayQuery, {
    client: clientPlstest,
    fetchPolicy: 'network-only',
    pollInterval: 5000,
  })

  //useEffects for listening to reponses
  //from ApolloClient queries
  //Pulsechain(mainnet)
  useEffect(() => {
    if (!plsmain) return
    setAutopayPlsmainData({
      data: plsmain.data,
      loading: plsmain.loading,
      error: plsmain.error,
    })
    return () => {
      setAutopayPlsmainData({})
    }
  }, [plsmain.data, plsmain.loading, plsmain.error]) //eslint-disable-line
  //Pulsechain(testnet)
  useEffect(() => {
    if (!plstest) return
    setAutopayPlstestData({
      data: plstest.data,
      loading: plstest.loading,
      error: plstest.error,
    })
    return () => {
      setAutopayPlstestData({})
    }
  }, [plstest.data, plstest.loading, plstest.error]) //eslint-disable-line
  //useEffects for decoding autopay events
  useEffect(() => {
    if (!autopayPlsmainData.data || !autopayPlstestData.data) return

    let eventsArray = []
    autopayPlsmainData.data.dataFeedEntities.forEach((event) => {
      event.chain = 'PulseChain (Mainnet)'
      event.txnLink = `https://scan.pulsechain.com/tx/${event.txnHash}`
      eventsArray.push(event)
    })
    autopayPlsmainData.data.tipAddedEntities.forEach((event) => {
      event.chain = 'PulseChain (Mainnet)'
      event.txnLink = `https://scan.pulsechain.com/tx/${event.txnHash}`
      eventsArray.push(event)
    })
    autopayPlstestData.data.dataFeedEntities.forEach((event) => {
      event.chain = 'PulseChain (Testnet)'
      event.txnLink = `https://scan.v4.testnet.pulsechain.com/tx/${event.txnHash}`
      eventsArray.push(event)
    })
    autopayPlstestData.data.tipAddedEntities.forEach((event) => {
      event.chain = 'PulseChain (Testnet)'
      event.txnLink = `https://scan.v4.testnet.pulsechain.com/tx/${event.txnHash}`
      eventsArray.push(event)
    })
    let sorted = sortDataByProperty('_startTime', eventsArray)
    setAllGraphData(sorted)

    return () => {
      setAllGraphData(null)
    }
  }, [autopayPlsmainData, autopayPlstestData])

  useEffect(() => {
    if (!allGraphData) return
    setDecodedData(decodingAutopayMiddleware(allGraphData))
    return () => {
      setDecodedData(null)
    }
  }, [allGraphData])

  const GraphContextObj = {
    decodedData: decodedData,
  }

  return (
    <GraphAutopayContext.Provider value={GraphContextObj}>
      {children}
    </GraphAutopayContext.Provider>
  )
}

export default GraphAutopay
