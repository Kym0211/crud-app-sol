'use client'

import { Keypair, PublicKey } from '@solana/web3.js'
import { useMemo, useState } from 'react'
import { ellipsify } from '../ui/ui-layout'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useCrudappProgram, useCrudappProgramAccount } from './crudapp-data-access'
import { useWallet } from '@solana/wallet-adapter-react'

export function CrudappCreate() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const { createJournalEntry } = useCrudappProgram()
  const { publicKey } = useWallet()

  const isFormValid = title.trim() !== '' && message.trim() !== ''

  const handleSubmit = () => {
    if(publicKey && isFormValid) {
      console.log(publicKey, title, message)
      createJournalEntry.mutateAsync({ title, message, owner: publicKey })
    }
  }

  if(!publicKey) {
    return (
      <div className="alert alert-warning">
        Please connect your wallet to create a journal entry.
      </div>
    )
  }

  return (
    <div className="space-y-4 flex flex-col items-center">
      <input type="text" className="input input-bordered w-full max-w-xs" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="textarea textarea-bordered w-full max-w-xs" placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} />
      <button className="btn btn-xs lg:btn-md btn-primary" onClick={handleSubmit} disabled={createJournalEntry.isPending || !isFormValid}>
        {createJournalEntry.isPending ? 'Creating...' : 'Create'}
      </button>
    </div>
  )
}

export function CrudappList() {
  const { accounts, getProgramAccount } = useCrudappProgram()

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>;
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="flex justify-center alert alert-info">
        <span>
          Program account not found. Make sure you have deployed the program and
          are on the correct cluster.
        </span>
      </div>
    );
  }
  return (
    <div className={"space-y-6"}>
      {accounts.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : accounts.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {accounts.data?.map((account) => (
            <CrudappCard
              key={account.publicKey.toString()}
              account={account.publicKey}
            />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={"text-2xl"}>No accounts</h2>
          No accounts found. Create one above to get started.
        </div>
      )}
    </div>
  );
}

function CrudappCard({ account }: { account: PublicKey }) {
  const { accountQuery, updateJournalEntry, deleteJournalEntry } = useCrudappProgramAccount({ account })
  const { publicKey } = useWallet()
  const [message, setMessage] = useState("")
  const title = accountQuery.data?.title
  console.log(accountQuery)

  const isFormValid = message.trim() !== ''

  const handleSubmit = () => {
    if(publicKey && isFormValid) {
      updateJournalEntry.mutateAsync({ title: title!, message, owner: publicKey })
    }
  }
  
  if(!publicKey) {
    return (
      <div className="alert alert-warning">
        Please connect your wallet to update a journal entry.
      </div>
    )
  }

  return accountQuery.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <div className="card card-bordered border-base-300 border-4 text-neutral-content">
      <div className="card-body items-center text-center">
        <div className="space-y-6">
          <h2 className="card-title justify-center text-3xl cursor-pointer" onClick={() => accountQuery.refetch()}>{title}</h2>
          <p>{accountQuery.data?.message}</p>
          <div className="card-actions justify-around">
            <textarea className="textarea textarea-bordered w-full max-w-xs" placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} />
            <button className="btn btn-xs lg:btn-md btn-primary" onClick={handleSubmit} disabled={updateJournalEntry.isPending || !isFormValid}>
              {updateJournalEntry.isPending ? 'Updating...' : 'Update'}
            </button>
            <button className="btn btn-xs lg:btn-md btn-error" onClick={() => deleteJournalEntry.mutateAsync(title!)} disabled={deleteJournalEntry.isPending}>
              {deleteJournalEntry.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
  
}
