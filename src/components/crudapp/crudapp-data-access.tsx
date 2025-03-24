'use client'

import { getCrudappProgram, getCrudappProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'

interface createEntryArgs {
  title: string
  message: string
  owner: PublicKey
}

export function useCrudappProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getCrudappProgramId(cluster.network as Cluster), [cluster])

  const program = useMemo(() => getCrudappProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['crudapp', 'all', { cluster }],
    queryFn: () => program.account.journalEntryState.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const createJournalEntry = useMutation<string, Error, createEntryArgs>({
    mutationKey: ['journalEntry', 'create'],
    mutationFn: async ({ title, message, owner }) => {
      return program.methods.createJournalEntry(title, message).rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      accounts.refetch()
    },
    onError: (err) => {
      toast.error(err.message)
    }
  })

  return {
    program,
    createJournalEntry,
    accounts,
    getProgramAccount,
  }
}

export function useCrudappProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useCrudappProgram()
  console.log(program)
  const programId = program.programId

  const accountQuery = useQuery({
    queryKey: ['crudapp', 'fetch', { cluster, account }],
    queryFn: () => program.account.journalEntryState.fetch(account),
  })

  const updateJournalEntry = useMutation<string, Error, createEntryArgs>({
    mutationKey: ['journalEntry', 'update', { cluster }],
    mutationFn: async ({ title, message, owner }) => {
      const [journalEntryAddress] = await PublicKey.findProgramAddressSync(
        [Buffer.from(title), owner.toBuffer()],
        programId
        
      );
      return program.methods.updateJournalEntry(title, message).rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
    },
    onError: (err) => {
      toast.error(err.message)
    }
  })

  const deleteJournalEntry = useMutation({
    mutationKey: ['journalEntry', 'delete', { cluster, account }],
    mutationFn: ( title:string ) => {
      return program.methods.deleteJournalEntry(title).rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
    },
    onError: (err) => {
      toast.error(err.message)
    }
  })

  return {
    accountQuery,
    updateJournalEntry,
    deleteJournalEntry,
  }
}
